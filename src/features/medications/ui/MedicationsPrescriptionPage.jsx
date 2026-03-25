import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Search } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getMedicationsByPrescription,
} from "../../../features/medications";
import {
  getPrescriptionWorkflowState,
  getReceivedPrescriptionsByPatient,
  mapPrescriptionToPdfPreview,
  markPrescriptionAsReceived,
  validatePrescriptionAndActivateTreatments,
} from "../../../features/prescriptions";
import { getUserProfile } from "../../../features/profile";
import { logError } from "../../../shared/lib/logger";
import {
  PrescriptionDocumentPreview,
  DoctorCard,
  EmptyStateMedical,
  MedicationItem,
  PrescriptionStatusBadge,
  PrescriptionPreviewPanel,
  PrescriptionCard,
  StepProgress,
} from "./components/MedicalUiComponents";

const WORKFLOW_STEPS = [
  "Médecin",
  "Ordonnance",
  "Validation",
  "Traitements actifs",
];

const statusToLabel = (status) => {
  if (!status) return "en attente";
  if (status === "validated_by_patient") return "validé";
  if (status === "sent") return "envoyé";
  if (status === "received") return "reçu";
  if (status === "active") return "actif";
  if (status === "completed") return "terminé";
  if (status === "pdf_generated") return "brouillon";
  return status;
};

const getStepIndex = (selectedDoctor, selectedPrescription, validated) => {
  if (validated) return 3;
  if (selectedPrescription) return 2;
  if (selectedDoctor) return 1;
  return 0;
};

export const MedicationsPrescriptionPage = () => {
  const { user } = useAuth();
  const { prescriptionId: prescriptionIdFromRoute } = useParams();

  const [medicationsByDoctor, setMedicationsByDoctor] = useState({});
  const [doctorsInfo, setDoctorsInfo] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [isValidating, setIsValidating] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  const fetchUserMedications = useCallback(async () => {
    if (!user) return;

    const allPrescriptions = await getReceivedPrescriptionsByPatient(user.uid);

    const groupedMedications = {};
    const doctors = {};

    for (const prescription of allPrescriptions) {
      const medications = await getMedicationsByPrescription(prescription.id);
      const doctorId = prescription.createdBy;

      if (!groupedMedications[doctorId]) {
        groupedMedications[doctorId] = [];
      }

      groupedMedications[doctorId].push({
        prescriptionId: prescription.id,
        patientId: prescription.patientId,
        createdBy: prescription.createdBy,
        medications,
        creationDate: prescription.creationDate,
        status: prescription.status,
        validation: prescription.validation || null,
        metadata: prescription.metadata || null,
        clinicalInfo: prescription.clinicalInfo || null,
      });

      if (!doctors[doctorId]) {
        doctors[doctorId] = await getUserProfile(doctorId);
      }

      if (prescription.id === prescriptionIdFromRoute) {
        setSelectedDoctor(doctorId);
        setSelectedPrescription(prescription.id);
        await markPrescriptionAsReceived(prescription.id, user.uid);
      }
    }

    setMedicationsByDoctor(groupedMedications);
    setDoctorsInfo(doctors);
  }, [prescriptionIdFromRoute, user]);

  useEffect(() => {
    if (user) {
      fetchUserMedications();
    }
  }, [fetchUserMedications, user]);

  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!user?.uid) return;

      try {
        const profile = await getUserProfile(user.uid);
        setPatientProfile(profile);
      } catch (error) {
        logError("Erreur chargement profil patient", error, {
          feature: "medications",
          action: "fetchPatientProfile",
          userId: user?.uid,
        });
      }
    };

    fetchPatientProfile();
  }, [user?.uid]);

  const handleValidatePrescription = async () => {
    if (!selectedPrescription || !startDate) return;

    const workflowState = getPrescriptionWorkflowState(selectedPrescriptionData, user?.uid);
    if (!workflowState.canValidate) {
      alert(workflowState.message || workflowState.validationBlockedReason || "Ordonnance déjà validée.");
      return;
    }

    setIsValidating(true);
    try {
      await validatePrescriptionAndActivateTreatments({
        prescriptionId: selectedPrescription,
        patientId: user.uid,
        startDate,
      });

      await fetchUserMedications();
      alert("Ordonnance validée et traitements activés avec succès.");
    } catch (error) {
      logError("Erreur validation ordonnance", error, {
        feature: "medications",
        action: "handleValidatePrescription",
        selectedPrescription,
        userId: user?.uid,
      });
      alert(error?.message || "Impossible de valider cette ordonnance.");
    } finally {
      setIsValidating(false);
    }
  };

  const filteredDoctors = useMemo(
    () =>
      Object.keys(doctorsInfo).filter((doctorId) => {
        const doctor = doctorsInfo[doctorId];
        return `${doctor?.firstName || ""} ${doctor?.lastName || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }),
    [doctorsInfo, searchTerm]
  );

  const prescriptionsForDoctor = selectedDoctor ? medicationsByDoctor[selectedDoctor] || [] : [];
  const selectedPrescriptionData = prescriptionsForDoctor.find(
    (prescription) => prescription.prescriptionId === selectedPrescription
  );
  const selectedMedications = selectedPrescriptionData?.medications || [];
  const workflowState = getPrescriptionWorkflowState(selectedPrescriptionData, user?.uid);
  const validated = workflowState.isLocked;
  const stepIndex = getStepIndex(selectedDoctor, selectedPrescription, validated);

  const activeTreatments = Object.values(medicationsByDoctor)
    .flatMap((prescriptions) => prescriptions.flatMap((prescription) => prescription.medications || []))
    .length;

  const previewPrescription = mapPrescriptionToPdfPreview({
    prescription: selectedPrescriptionData
      ? {
          id: selectedPrescriptionData.prescriptionId,
          creationDate: selectedPrescriptionData.creationDate,
          medications: selectedMedications,
          status: selectedPrescriptionData.status,
          metadata: selectedPrescriptionData.metadata,
          clinicalInfo: selectedPrescriptionData.clinicalInfo,
          validation: selectedPrescriptionData.validation,
          patientId: selectedPrescriptionData.patientId,
        }
      : null,
    patient: patientProfile,
    doctor: doctorsInfo[selectedDoctor],
  });

  useEffect(() => {
    if (workflowState?.patientStartDate) {
      setStartDate(workflowState.patientStartDate);
    }
  }, [workflowState?.patientStartDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Mes Médications</h1>
            <p className="text-sm text-neutral-500 mt-1">Consultez vos ordonnances, validez leur démarrage et suivez vos traitements actifs.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Prescriptions</p>
              <p className="text-2xl font-semibold text-neutral-900">{Object.values(medicationsByDoctor).flat().length}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Traitements actifs</p>
              <p className="text-2xl font-semibold text-neutral-900">{activeTreatments}</p>
            </div>
          </div>
        </header>

        <StepProgress steps={WORKFLOW_STEPS} currentStep={stepIndex} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-3 rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-neutral-900 font-semibold">Médecins</h2>
              <PrescriptionStatusBadge status={`${filteredDoctors.length} actif(s)`} className="bg-neutral-100 text-neutral-700 border-neutral-200" />
            </div>

            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Rechercher un médecin"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 outline-none"
              />
            </label>

            <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
              {filteredDoctors.map((doctorId) => (
                <DoctorCard
                  key={doctorId}
                  doctor={doctorsInfo[doctorId]}
                  selected={selectedDoctor === doctorId}
                  onSelect={() => {
                    setSelectedDoctor(doctorId);
                    setSelectedPrescription(null);
                  }}
                  prescriptionsCount={medicationsByDoctor[doctorId]?.length || 0}
                />
              ))}

              {filteredDoctors.length === 0 ? (
                <EmptyStateMedical
                  title="Aucun médecin trouvé"
                  description="Ajustez votre recherche pour afficher vos prescripteurs."
                />
              ) : null}
            </div>
          </aside>

          <section className="xl:col-span-5 rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 sm:p-6 space-y-4">
            {selectedDoctor ? (
              <>
                <h3 className="text-neutral-900 font-semibold text-xl">Prescriptions reçues</h3>
                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                  {prescriptionsForDoctor
                    .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
                    .map(({ prescriptionId, creationDate, status, medications }) => (
                      <PrescriptionCard
                        key={prescriptionId}
                        title={`Ordonnance #${prescriptionId.slice(-6)}`}
                        subtitle={new Date(creationDate).toLocaleDateString("fr-FR")}
                        status={statusToLabel(status)}
                        selected={selectedPrescription === prescriptionId}
                        onSelect={() => setSelectedPrescription(prescriptionId)}
                        medicationsCount={medications.length}
                      />
                    ))}
                </div>

                {selectedPrescription ? (
                  <div className="space-y-4">
                    <section className="rounded-[20px] border border-neutral-100 bg-neutral-50 p-4">
                      {workflowState.canValidate ? (
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div>
                            <h4 className="text-neutral-900 font-semibold">Validation de l&apos;ordonnance</h4>
                            <p className="text-sm text-neutral-500">Confirmez la date de démarrage pour activer le suivi thérapeutique.</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="date"
                              value={startDate}
                              onChange={(event) => setStartDate(event.target.value)}
                              className="h-11 rounded-xl border border-neutral-200 bg-white px-4 text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleValidatePrescription}
                              disabled={isValidating || !startDate}
                              className="h-11 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:bg-neutral-300 text-white font-medium px-5 inline-flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              {isValidating ? "Validation..." : "Valider l'ordonnance"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-neutral-900 font-semibold">Ordonnance déjà validée</h4>
                            <PrescriptionStatusBadge status={statusToLabel(selectedPrescriptionData?.status)} />
                          </div>
                          <p className="text-sm text-neutral-600">{workflowState.message || workflowState.validationBlockedReason || "Validation indisponible."}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-600">
                            <p>Validation : {workflowState.validatedAt ? new Date(workflowState.validatedAt).toLocaleDateString("fr-FR") : "Non renseignée"}</p>
                            <p>Début traitement : {workflowState.patientStartDate ? new Date(workflowState.patientStartDate).toLocaleDateString("fr-FR") : "Non renseigné"}</p>
                          </div>
                        </div>
                      )}
                    </section>

                    <div className="space-y-3">
                      {selectedMedications.map((medication) => (
                        <MedicationItem
                          key={medication.id}
                          medication={medication}
                          actions={false}
                          readonlyActions
                          onViewDetails={() => alert("Le détail complet est visible dans l'aperçu clinique à droite.")}
                          onContactDoctor={() => alert("Contact médecin : utilisez la messagerie sécurisée HealthSync.")}
                          onReportProblem={() => alert("Signalement enregistré. Un professionnel vous répondra rapidement.")}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyStateMedical
                    title="Sélectionnez une ordonnance"
                    description="Choisissez une prescription pour afficher le détail des traitements."
                  />
                )}
              </>
            ) : (
              <EmptyStateMedical
                title="Sélectionnez un médecin"
                description="Choisissez un prescripteur pour voir vos ordonnances reçues."
              />
            )}
          </section>

          <aside className="xl:col-span-4 xl:sticky xl:top-24 self-start">
            <PrescriptionPreviewPanel
              title="Détails ordonnance"
              subtitle="Version document clinique réaliste de l’ordonnance sélectionnée."
              status={statusToLabel(selectedPrescriptionData?.status)}
              sticky
            >
              {selectedPrescriptionData ? (
                <div className="max-h-[70vh] overflow-auto rounded-[20px] bg-neutral-50 p-3">
                  <PrescriptionDocumentPreview
                    prescription={previewPrescription}
                    patient={patientProfile}
                    doctor={doctorsInfo[selectedDoctor]}
                  />
                </div>
              ) : (
                <EmptyStateMedical
                  title="Détail indisponible"
                  description="Le panneau affichera les informations dès qu'une ordonnance est sélectionnée."
                />
              )}
            </PrescriptionPreviewPanel>
          </aside>
        </div>
    </div>
  );
};

