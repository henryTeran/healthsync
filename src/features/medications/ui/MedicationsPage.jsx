import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Search, Users } from "lucide-react";
import { MedicationSearch } from "./MedicationSearch";
import { PrescriptionForm } from "../../prescriptions/ui/PrescriptionForm";
import {
  buildSwissEPrescriptionPayload,
  generateSwissERxToken,
  getPrescriptionById,
  savePrescription,
  signAndRegisterSwissEPrescription,
  SWISS_EPRESCRIPTION_ISSUE_TYPES,
  updatePrescription,
  validateSwissEPrescriptionPayload,
} from "../../../features/prescriptions";
import { addMedication, deleteMedication, getMedicationsByPrescription } from "../../../features/medications";
import { useAuth } from "../../../contexts/AuthContext";
import { getAuthorizedPatients, getUserProfile } from "../../../features/profile";
import { logDebug, logError } from "../../../shared/lib/logger";
import { PRESCRIPTION_STATUS } from "../../prescriptions/domain/prescriptionStatus";
import {
  EmptyStateMedical,
  MedicationItem,
  PatientCard,
  PrescriptionPreviewPanel,
  StepProgress,
} from "./components/MedicalUiComponents";

const WORKFLOW_STEPS = [
  "Patient sélectionné",
  "Médicaments ajoutés",
  "PDF généré",
  "Envoyé",
  "Validé patient",
];

const getSwissMissingFields = ({
  ePrescriptionForm,
  selectedPatient,
  doctorProfile,
  idPrescription,
  selectedMedications,
  requiresRevocationReason,
  revocationReason,
}) => {
  const missing = [];

  if (!selectedPatient) {
    missing.push("Patient sélectionné requis");
  }

  if (selectedPatient) {
    const payload = buildSwissEPrescriptionPayload({
      formValues: ePrescriptionForm,
      doctorProfile,
      patient: selectedPatient,
      prescriptionId: idPrescription,
      medications: selectedMedications,
    });

    missing.push(
      ...validateSwissEPrescriptionPayload(payload, {
        requireSignedToken: false,
      })
    );
  }

  if (requiresRevocationReason && !revocationReason.trim()) {
    missing.push("Motif de révocation obligatoire");
  }

  return [...new Set(missing)];
};

const IMMUTABLE_PRESCRIPTION_STATUSES = new Set([
  PRESCRIPTION_STATUS.PDF_GENERATED,
  PRESCRIPTION_STATUS.SENT,
  PRESCRIPTION_STATUS.RECEIVED,
  PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT,
  PRESCRIPTION_STATUS.ACTIVE,
]);

const getStepIndex = (prescriptionStatus, selectedPatient, selectedMedications) => {
  if (
    prescriptionStatus === PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT ||
    prescriptionStatus === PRESCRIPTION_STATUS.ACTIVE ||
    prescriptionStatus === PRESCRIPTION_STATUS.COMPLETED
  ) {
    return 4;
  }

  if (prescriptionStatus === PRESCRIPTION_STATUS.SENT) return 3;
  if (prescriptionStatus === PRESCRIPTION_STATUS.PDF_GENERATED) return 2;
  if (selectedMedications.length > 0) return 1;
  if (selectedPatient) return 0;

  return -1;
};

export const MedicationsPage = () => {
  const { user } = useAuth();
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [idPatient, setIdPatient] = useState("");
  const [idPrescription, setIdPrescription] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPdf, setShowPdf] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [statusBanner, setStatusBanner] = useState("");
  const [prescriptionStatus, setPrescriptionStatus] = useState(PRESCRIPTION_STATUS.DRAFT);
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0);
  const [revocationReason, setRevocationReason] = useState("");
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [ePrescriptionForm, setEPrescriptionForm] = useState({
    issueType: SWISS_EPRESCRIPTION_ISSUE_TYPES.SINGLE,
    issuedAt: new Date().toISOString().split("T")[0],
    validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
    placeOfIssue: "",
    repeatsAllowed: 0,
    substitutionAllowed: false,
    emergencyPrescription: false,
    therapeuticPurpose: "",
    legalNotes: "",
    avsNumber: "",
    insuranceName: "",
    insuranceNumber: "",
    prescriberGLN: "",
    prescriberZSR: "",
    prescriberRCC: "",
    prescriberProfessionalId: "",
    signedRegisteredToken: "",
    narcoticsExcludedDeclaration: false,
    reference: "",
    medicalRecordNumber: "",
  });
  const [clinicalInfoForm, setClinicalInfoForm] = useState({
    allergies: "",
    history: "",
    diagnosis: "",
    notes: "",
  });

  const handlePrescriptionStatusChange = useCallback((status) => {
    if (status) setPrescriptionStatus(status);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoadingPatients(true);
        if (!user || user.userType === "patient") return;
        const contactsData = await getAuthorizedPatients(user.uid);
        setContacts(contactsData);
      } catch (error) {
        logError("Erreur lors de la récupération des patients", error, {
          feature: "medications",
          action: "fetchPatients",
          userId: user?.uid,
        });
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [user]);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user?.uid) return;

      try {
        const profile = await getUserProfile(user.uid);
        setDoctorProfile(profile || null);
        setEPrescriptionForm((previous) => ({
          ...previous,
          placeOfIssue: previous.placeOfIssue || profile?.state || profile?.country || "",
          prescriberGLN: previous.prescriberGLN || profile?.gln || "",
          prescriberZSR: previous.prescriberZSR || profile?.zsr || "",
          prescriberRCC: previous.prescriberRCC || profile?.rcc || "",
          prescriberProfessionalId:
            previous.prescriberProfessionalId ||
            profile?.professionalId ||
            profile?.medicalLicense ||
            "",
        }));
      } catch (error) {
        logError("Erreur chargement profil médecin", error, {
          feature: "medications",
          action: "fetchDoctorProfile",
          userId: user?.uid,
        });
      }
    };

    fetchDoctorProfile();
  }, [user?.uid]);

  useEffect(() => {
    if (!statusBanner) return;

    const timeout = setTimeout(() => setStatusBanner(""), 3200);
    return () => clearTimeout(timeout);
  }, [statusBanner]);

  const filteredPatients = useMemo(
    () =>
      contacts.filter((patient) => {
        const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
        return fullName.includes(patientSearch.toLowerCase());
      }),
    [contacts, patientSearch]
  );

  const handleContactSelect = (contact) => {
    const hasPatientChanged = contact?.id && contact.id !== selectedPatient?.id;

    setIdPatient(contact.id);
    setSelectedPatient(contact);
    setStatusBanner("");

    if (hasPatientChanged) {
      setIdPrescription(null);
      setShowPdf(false);
      setSelectedMedications([]);
      setPrescriptionStatus(PRESCRIPTION_STATUS.DRAFT);
      setRevocationReason("");
      setPreviewRefreshToken(0);
      setEPrescriptionForm((previous) => ({
        ...previous,
        signedRegisteredToken: "",
        reference: "",
      }));
    }

    setClinicalInfoForm((previous) => ({
      ...previous,
      allergies: contact?.allergies || previous.allergies,
    }));
  };

  const syncMedicationsForPrescription = async (targetPrescriptionId, replaceExisting = false) => {
    if (!targetPrescriptionId) return;

    if (replaceExisting) {
      const medications = await getMedicationsByPrescription(targetPrescriptionId);
      logDebug("Suppression médicaments avant mise à jour", {
        feature: "medications",
        action: "syncMedicationsForPrescription",
        prescriptionId: targetPrescriptionId,
        medicationsCount: medications.length,
      });

      await Promise.all(
        medications.map((medication) => deleteMedication(medication.documentId || medication.id))
      );
    }

    for (const medication of selectedMedications) {
      await addMedication({
        idPrescription: targetPrescriptionId,
        medication,
        patientId: idPatient,
        doctorId: user.uid,
      });
    }
  };

  const buildSwissPayloadOrFail = async () => {
    const basePayload = buildSwissEPrescriptionPayload({
      formValues: ePrescriptionForm,
      doctorProfile,
      patient: selectedPatient,
      prescriptionId: idPrescription,
      medications: selectedMedications,
    });

    const preSigningErrors = validateSwissEPrescriptionPayload(basePayload, {
      requireSignedToken: false,
    });

    if (preSigningErrors.length > 0) {
      throw new Error(preSigningErrors[0]);
    }

    const signingResult = await signAndRegisterSwissEPrescription(basePayload);

    const ePrescription = {
      ...basePayload,
      signedRegisteredToken: signingResult.signedRegisteredToken,
      datasetChecksum: signingResult.datasetChecksum,
      registration: {
        registrationId: signingResult.registrationId,
        registeredAt: signingResult.registeredAt,
        serviceStatus: signingResult.serviceStatus,
        serviceSignature: signingResult.serviceSignature,
      },
    };

    setEPrescriptionForm((previous) => ({
      ...previous,
      signedRegisteredToken: signingResult.signedRegisteredToken,
      reference: previous.reference || ePrescription.reference,
    }));

    const validationErrors = validateSwissEPrescriptionPayload(ePrescription);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }

    return {
      ePrescription,
      clinicalInfo: {
        allergies: clinicalInfoForm?.allergies || selectedPatient?.allergies || null,
        history: clinicalInfoForm?.history || null,
        diagnosis: clinicalInfoForm?.diagnosis || null,
        notes: clinicalInfoForm?.notes || null,
      },
      metadata: {
        place: ePrescription.placeOfIssue,
        medicalRecordNumber: ePrescriptionForm.medicalRecordNumber || selectedPatient?.recordNumber || null,
        legalNotes: ePrescription.legalNotes,
      },
    };
  };

  const handleAddMedication = (medication) => {
    const normalizedMedication = {
      ...medication,
      frequency: medication?.frequency || "1 fois par jour",
      duration: medication?.duration || "7 jours",
      controlledSubstance: Boolean(medication?.controlledSubstance || medication?.isNarcotic),
    };

    setSelectedMedications((previous) => [...previous, normalizedMedication]);
  };

  const handleRemoveMedication = (index) => {
    setSelectedMedications((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSavePrescription = async () => {
    setShowPdf(true);

    if (!user?.uid) {
      alert("Utilisateur non authentifié.");
      return;
    }

    if (!idPatient || selectedMedications.length === 0) {
      alert("Veuillez sélectionner un patient et ajouter des médicaments.");
      return;
    }

    if (isSubmittingPrescription) {
      return;
    }

    setIsSubmittingPrescription(true);

    try {
      if (!idPrescription) {
        const swissPayload = await buildSwissPayloadOrFail();

        const prescriptionId = await savePrescription(user.uid, idPatient, swissPayload);
        setIdPrescription(prescriptionId);
        setPrescriptionStatus(PRESCRIPTION_STATUS.CREATED);

        await syncMedicationsForPrescription(prescriptionId, false);

        setStatusBanner("Prescription créée avec succès.");
        setPreviewRefreshToken((previous) => previous + 1);
      }
    } catch (error) {
      alert(error?.message || "Erreur lors de l'enregistrement de la prescription.");
      logError("Erreur création ordonnance", error, {
        feature: "medications",
        action: "handleSavePrescription",
        patientId: idPatient,
      });
    } finally {
      setIsSubmittingPrescription(false);
    }
  };

  const handleUpdatePrescription = async () => {
    setShowPdf(true);

    if (!user?.uid) {
      alert("Utilisateur non authentifié.");
      return;
    }

    if (!idPatient || selectedMedications.length === 0) {
      alert("Veuillez sélectionner un patient et ajouter des médicaments.");
      return;
    }

    if (isSubmittingPrescription) {
      return;
    }

    setIsSubmittingPrescription(true);

    try {
      if (idPrescription) {
        const swissPayload = await buildSwissPayloadOrFail();
        const currentPrescription = await getPrescriptionById(idPrescription);

        if (!currentPrescription) {
          throw new Error("Ordonnance introuvable.");
        }

        const mustRevokeAndRecreate = IMMUTABLE_PRESCRIPTION_STATUSES.has(
          currentPrescription.status
        );

        if (mustRevokeAndRecreate) {
          if (!revocationReason.trim()) {
            throw new Error("Le motif de révocation est obligatoire pour recréer une ordonnance déjà émise.");
          }

          const newPrescriptionId = await savePrescription(user.uid, idPatient, {
            ...swissPayload,
            metadata: {
              ...(swissPayload.metadata || {}),
              replacementOfPrescriptionId: idPrescription,
              revisionType: "recreated_after_revocation",
              revocationReason: revocationReason.trim(),
            },
          });

          await syncMedicationsForPrescription(newPrescriptionId, false);

          await updatePrescription(idPrescription, {
            status: PRESCRIPTION_STATUS.CANCELLED,
            statusUpdatedAt: new Date().toISOString(),
            revocation: {
              revokedAt: new Date().toISOString(),
              revokedBy: user.uid,
              reason: revocationReason.trim(),
              replacedByPrescriptionId: newPrescriptionId,
            },
          });

          setIdPrescription(newPrescriptionId);
          setPrescriptionStatus(PRESCRIPTION_STATUS.CREATED);
          setRevocationReason("");
          setStatusBanner(
            "Ordonnance existante révoquée puis recréée avec une nouvelle référence."
          );
          setPreviewRefreshToken((previous) => previous + 1);
          return;
        }

        await syncMedicationsForPrescription(idPrescription, true);

        await updatePrescription(idPrescription, {
          ...swissPayload,
          status: PRESCRIPTION_STATUS.UPDATED,
          statusUpdatedAt: new Date().toISOString(),
        });

        setStatusBanner("Prescription mise à jour.");
        setPreviewRefreshToken((previous) => previous + 1);
      }
    } catch (error) {
      alert(error?.message || "Erreur lors de la modification de la prescription.");
      logError("Erreur mise à jour ordonnance", error, {
        feature: "medications",
        action: "handleUpdatePrescription",
        prescriptionId: idPrescription,
      });
    } finally {
      setIsSubmittingPrescription(false);
    }
  };

  const progressIndex = getStepIndex(prescriptionStatus, selectedPatient, selectedMedications);
  const requiresRevocationReason =
    Boolean(idPrescription) && IMMUTABLE_PRESCRIPTION_STATUSES.has(prescriptionStatus);

  const missingSwissFields = useMemo(
    () =>
      getSwissMissingFields({
        ePrescriptionForm,
        selectedPatient,
        doctorProfile,
        idPrescription,
        selectedMedications,
        requiresRevocationReason,
        revocationReason,
      }),
    [
      ePrescriptionForm,
      selectedPatient,
      doctorProfile,
      idPrescription,
      selectedMedications,
      requiresRevocationReason,
      revocationReason,
    ]
  );

  const canSubmitSwissPrescription = missingSwissFields.length === 0;

  const handleGenerateSwissToken = () => {
    if (!user?.uid) return;
    const currentReference =
      ePrescriptionForm.reference ||
      `CH-ERX-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const token = generateSwissERxToken({ userId: user.uid, reference: currentReference });

    setEPrescriptionForm((previous) => ({
      ...previous,
      reference: previous.reference || currentReference,
      signedRegisteredToken: token,
    }));
  };

  const handleApplySwissQuickDefaults = () => {
    const chronic = Number(ePrescriptionForm.repeatsAllowed || 0) > 0;

    setEPrescriptionForm((previous) => ({
      ...previous,
      issueType: chronic
        ? SWISS_EPRESCRIPTION_ISSUE_TYPES.CHRONIC
        : SWISS_EPRESCRIPTION_ISSUE_TYPES.SINGLE,
      validUntil: chronic
        ? new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split("T")[0]
        : previous.validUntil,
      legalNotes:
        previous.legalNotes ||
        "Ordonnance électronique conforme aux principes E-Rezept Suisse (CHMED16A rev.2).",
    }));
  };

  const handleAutofillFromPatient = () => {
    setEPrescriptionForm((previous) => ({
      ...previous,
      avsNumber: previous.avsNumber || selectedPatient?.avsNumber || "",
      insuranceName: previous.insuranceName || selectedPatient?.insuranceName || "",
      insuranceNumber: previous.insuranceNumber || selectedPatient?.insuranceNumber || "",
      medicalRecordNumber: previous.medicalRecordNumber || selectedPatient?.recordNumber || "",
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Ordonnances et Médications</h1>
            <p className="text-sm text-neutral-500 mt-1">Créez des prescriptions, validez le workflow clinique et générez les documents patients.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Patients suivis</p>
              <p className="text-2xl font-semibold text-neutral-900">{contacts.length}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Médicaments</p>
              <p className="text-2xl font-semibold text-neutral-900">{selectedMedications.length}</p>
            </div>
          </div>
        </header>

        <StepProgress steps={WORKFLOW_STEPS} currentStep={progressIndex} />

        {statusBanner ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusBanner}
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-3 rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-neutral-900 font-semibold">Patients suivis</h2>
              <Users className="h-5 w-5 text-medical-600" />
            </div>

            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Rechercher un patient"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 outline-none"
              />
            </label>

            <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
              {isLoadingPatients
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-[20px] border border-neutral-100 bg-neutral-100 p-4 h-24 animate-pulse" />
                  ))
                : filteredPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      selected={selectedPatient?.id === patient.id}
                      onSelect={handleContactSelect}
                    />
                  ))}

              {!isLoadingPatients && filteredPatients.length === 0 ? (
                <EmptyStateMedical
                  title="Aucun patient"
                  description="Aucun patient ne correspond à votre recherche actuelle."
                />
              ) : null}
            </div>
          </aside>

          <section className="xl:col-span-5 rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 sm:p-6 space-y-5">
            {selectedPatient ? (
              <>
                <div>
                  <h2 className="text-neutral-900 font-semibold text-xl">Créer une ordonnance</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Patient: {selectedPatient.firstName} {selectedPatient.lastName} • Allergies: {selectedPatient.allergies || "Aucune connue"}
                  </p>
                </div>

                <section className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-900">Paramètres e-ordonnance Suisse</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAutofillFromPatient}
                      className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 hover:bg-neutral-50"
                    >
                      Préremplir depuis patient
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateSwissToken}
                      className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 hover:bg-neutral-50"
                    >
                      Générer token eRx
                    </button>
                    <button
                      type="button"
                      onClick={handleApplySwissQuickDefaults}
                      className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 hover:bg-neutral-50"
                    >
                      Appliquer valeurs recommandées CH
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-xs text-neutral-600">Type
                      <select
                        value={ePrescriptionForm.issueType}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, issueType: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      >
                        <option value={SWISS_EPRESCRIPTION_ISSUE_TYPES.SINGLE}>Unique</option>
                        <option value={SWISS_EPRESCRIPTION_ISSUE_TYPES.RENEWABLE}>Renouvelable</option>
                        <option value={SWISS_EPRESCRIPTION_ISSUE_TYPES.CHRONIC}>Traitement chronique</option>
                      </select>
                    </label>
                    <label className="text-xs text-neutral-600">Date d&apos;émission
                      <input
                        type="date"
                        value={ePrescriptionForm.issuedAt}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, issuedAt: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Valable jusqu&apos;au
                      <input
                        type="date"
                        value={ePrescriptionForm.validUntil}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, validUntil: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Lieu d&apos;émission
                      <input
                        type="text"
                        value={ePrescriptionForm.placeOfIssue}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, placeOfIssue: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                        placeholder="Ville / Canton"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">GLN prescripteur
                      <input
                        type="text"
                        value={ePrescriptionForm.prescriberGLN}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, prescriberGLN: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">RCC / ID pro
                      <input
                        type="text"
                        value={ePrescriptionForm.prescriberRCC}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, prescriberRCC: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">ZSR prescripteur
                      <input
                        type="text"
                        value={ePrescriptionForm.prescriberZSR}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, prescriberZSR: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Identifiant professionnel
                      <input
                        type="text"
                        value={ePrescriptionForm.prescriberProfessionalId}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, prescriberProfessionalId: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Jeton dataset signé/enregistré
                      <input
                        type="text"
                        value={ePrescriptionForm.signedRegisteredToken}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, signedRegisteredToken: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                        placeholder="Token E-Rezept service"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">N° AVS patient
                      <input
                        type="text"
                        value={ePrescriptionForm.avsNumber}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, avsNumber: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Assureur
                      <input
                        type="text"
                        value={ePrescriptionForm.insuranceName}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, insuranceName: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">N° assurance
                      <input
                        type="text"
                        value={ePrescriptionForm.insuranceNumber}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, insuranceNumber: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">N° dossier médical
                      <input
                        type="text"
                        value={ePrescriptionForm.medicalRecordNumber}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, medicalRecordNumber: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Répétitions autorisées
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={ePrescriptionForm.repeatsAllowed}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, repeatsAllowed: Number(event.target.value || 0) }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                  </div>

                  <label className="text-xs text-neutral-600 block">Indication thérapeutique
                    <textarea
                      rows={2}
                      value={ePrescriptionForm.therapeuticPurpose}
                      onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, therapeuticPurpose: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-xs text-neutral-600">Diagnostic
                      <input
                        type="text"
                        value={clinicalInfoForm.diagnosis}
                        onChange={(event) => setClinicalInfoForm((previous) => ({ ...previous, diagnosis: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-600">Antécédents
                      <input
                        type="text"
                        value={clinicalInfoForm.history}
                        onChange={(event) => setClinicalInfoForm((previous) => ({ ...previous, history: event.target.value }))}
                        className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-neutral-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ePrescriptionForm.substitutionAllowed}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, substitutionAllowed: event.target.checked }))}
                      />
                      Substitution générique autorisée
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ePrescriptionForm.emergencyPrescription}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, emergencyPrescription: event.target.checked }))}
                      />
                      Ordonnance d&apos;urgence
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ePrescriptionForm.narcoticsExcludedDeclaration}
                        onChange={(event) => setEPrescriptionForm((previous) => ({ ...previous, narcoticsExcludedDeclaration: event.target.checked }))}
                      />
                      Je confirme l&apos;absence de stupéfiants (BetmVV-EDI)
                    </label>
                  </div>

                  {missingSwissFields.length > 0 ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <p className="font-semibold">Champs à compléter avant création / mise à jour :</p>
                      <p className="mt-1">{missingSwissFields.join(" • ")}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      Configuration e-ordonnance prête pour émission.
                    </div>
                  )}
                </section>

                {idPrescription && IMMUTABLE_PRESCRIPTION_STATUSES.has(prescriptionStatus) ? (
                  <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-amber-800">Révocation obligatoire avant nouvelle version</h3>
                    <p className="text-xs text-amber-700">
                      Cette ordonnance est déjà émise/signée. La correction passe par révocation puis recréation.
                    </p>
                    <label className="text-xs text-amber-800 block">Motif de révocation (obligatoire)
                      <textarea
                        rows={2}
                        value={revocationReason}
                        onChange={(event) => setRevocationReason(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-neutral-900"
                        placeholder="Exemple: correction posologie / dosage / fréquence"
                      />
                    </label>
                  </section>
                ) : null}

                <MedicationSearch onAddMedication={handleAddMedication} />

                <div className="space-y-3">
                  {selectedMedications.length > 0 ? (
                    selectedMedications.map((medication, index) => (
                      <MedicationItem
                        key={`${medication.name}-${index}`}
                        medication={medication}
                        onDelete={() => handleRemoveMedication(index)}
                        actions
                      />
                    ))
                  ) : (
                    <EmptyStateMedical
                      title="Aucun médicament sélectionné"
                      description="Ajoutez des traitements depuis la recherche pour construire l'ordonnance."
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={idPrescription ? handleUpdatePrescription : handleSavePrescription}
                  disabled={!canSubmitSwissPrescription || isSubmittingPrescription}
                  className="h-11 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium px-5"
                >
                  {isSubmittingPrescription
                    ? "Traitement en cours..."
                    : idPrescription
                    ? IMMUTABLE_PRESCRIPTION_STATUSES.has(prescriptionStatus)
                      ? "Révoquer puis recréer la prescription"
                      : "Mettre à jour la prescription"
                    : "Créer la prescription"}
                </button>
              </>
            ) : (
              <EmptyStateMedical
                title="Sélectionnez un patient"
                description="Choisissez un patient dans la colonne de gauche pour démarrer la création d’ordonnance."
              />
            )}
          </section>

          <section className="xl:col-span-4 xl:sticky xl:top-24 self-start">
            {idPrescription && showPdf ? (
              <PrescriptionForm
                prescriptionId={idPrescription}
                refreshToken={previewRefreshToken}
                onStatusChange={handlePrescriptionStatusChange}
              />
            ) : (
              <PrescriptionPreviewPanel
                title="Aperçu ordonnance"
                subtitle="Prévisualisez le document, générez le PDF et envoyez la prescription au patient."
                status={prescriptionStatus || "brouillon"}
                sticky
              >
                <EmptyStateMedical
                  title="Aucune ordonnance affichée"
                  description="Créez une prescription dans la colonne centrale pour afficher ici une feuille médicale prête à être imprimée ou envoyée."
                  action={
                    <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
                      <FileText className="h-4 w-4" /> Prévisualisation PDF disponible après création
                    </span>
                  }
                />
              </PrescriptionPreviewPanel>
            )}
          </section>
        </div>
    </div>
  );
};
