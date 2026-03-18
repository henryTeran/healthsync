// src/pages/MedicationPage.jsx
import React, { useEffect, useState } from "react";
import { MedicationSearch } from "./MedicationSearch";
import { PrescriptionTable } from "../../prescriptions/ui/PrescriptionTable";
import { savePrescription } from "../../../features/prescriptions";
import { addMedication, deleteMedication, getMedicationsByPrescription } from "../../../features/medications";
import { useAuth } from "../../../contexts/AuthContext";
import { getAuthorizedPatients } from "../../../features/profile";
import { CheckCircle2, Circle, FileText, UserCircle2, Users } from "lucide-react";
import { PrescriptionForm } from "../../prescriptions/ui/PrescriptionForm";
import { logDebug, logError } from "../../../shared/lib/logger";
import { PRESCRIPTION_STATUS } from "../../prescriptions/domain/prescriptionStatus";

const WORKFLOW_STEPS = [
  "Patient sélectionné",
  "Médicaments ajoutés",
  "PDF généré",
  "Envoyé",
  "Validé patient",
];

export const MedicationsPage = () => {
  const { user } = useAuth();
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [idPatient, setIdPatient] = useState(""); // ID du patient sélectionné
  const [idPrescription, setIdPrescription] = useState(null);
  const [contacts, setContacts] = useState([]); // Liste des contacts (patients)
  const [selectedPatient, setSelectedPatient] = useState(null); // Patient sélectionné
  const [showPdf, setShowPdf] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [statusBanner, setStatusBanner] = useState("");
  const [prescriptionStatus, setPrescriptionStatus] = useState(PRESCRIPTION_STATUS.DRAFT);

 // Charger les patients suivis par le médecin
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
      throw error;
    } finally {
      setIsLoadingPatients(false);
    }
  };

  fetchPatients();
}, [user]);

  // Gestion de la sélection d'un contact
  const handleContactSelect = (contact) => {
    setIdPatient(contact.id);
    setSelectedPatient(contact);
    setStatusBanner("");
  };

  const handleAddMedication = (medication) => {
    setSelectedMedications([...selectedMedications, medication]);
  };

  const handleRemoveMedication = (index) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    setShowPdf (!showPdf);
    if (!idPatient || selectedMedications.length === 0) {
      alert("Veuillez sélectionner un patient et ajouter des médicaments.");
      return;
    }

    try {
      if (idPrescription) {
        // Mettre à jour la prescription existante)
      }else {
        const prescriptionId = await savePrescription(user.uid, idPatient);
        setIdPrescription(prescriptionId);
        setPrescriptionStatus(PRESCRIPTION_STATUS.CREATED);

        // Enregistrer chaque médicament avec l'ID de la prescription
        for (const medication of selectedMedications) {
          await addMedication(prescriptionId, medication, idPatient, user.uid);
        }

        setStatusBanner("Prescription créée avec succès.");
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement de la prescription.");
      throw error
    }
  };
     
  const handleUpdatePrescription = async () => {
    setShowPdf (!showPdf);
    
    if (!idPatient || selectedMedications.length === 0) {
      alert("Veuillez sélectionner un patient et ajouter des médicaments.");
      return;
    }

    try {
      if (idPrescription) {      
        // Étape 1 : Supprimer tous les médicaments liés à la prescription existante
        const medications = await getMedicationsByPrescription(idPrescription);
        logDebug("Suppression des médicaments existants avant mise à jour", {
          feature: "medications",
          action: "handleUpdatePrescription",
          prescriptionId: idPrescription,
          medicationsCount: medications.length,
        });

        const deletePromises = medications.map((med) => {
          logDebug("Suppression médicament", {
            feature: "medications",
            action: "handleUpdatePrescription.deleteMedication",
            medicationId: med.id,
          });
          return deleteMedication(med.id);
        });
        await Promise.all(deletePromises);
       
        // Enregistrer chaque médicament avec l'ID de la prescription
        for (const medication of selectedMedications) {
          await addMedication(idPrescription, medication, idPatient, user.uid);
        }

        setStatusBanner("Prescription mise à jour.");
        
      }
      //PrescriptionForm.reset();
    } catch (error) {
      alert("Erreur lors de la modifation de la prescription.");
      throw error
    }
  };

  useEffect(() => {
    if (!statusBanner) return;

    const timeout = setTimeout(() => setStatusBanner(""), 3200);
    return () => clearTimeout(timeout);
  }, [statusBanner]);

  const getProgressIndex = () => {
    if (
      prescriptionStatus === PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT ||
      prescriptionStatus === PRESCRIPTION_STATUS.ACTIVE ||
      prescriptionStatus === PRESCRIPTION_STATUS.COMPLETED
    ) {
      return 4;
    }

    if (prescriptionStatus === PRESCRIPTION_STATUS.SENT) {
      return 3;
    }

    if (prescriptionStatus === PRESCRIPTION_STATUS.PDF_GENERATED) {
      return 2;
    }

    if (selectedMedications.length > 0) {
      return 1;
    }

    if (selectedPatient) {
      return 0;
    }

    return -1;
  };

  const progressIndex = getProgressIndex();
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Ordonnances & Médications</h1>
          <p className="text-sm text-neutral-500">Sélection patient, composition d'ordonnance et génération du document clinique.</p>
        </header>

        <section className="rounded-[22px] border border-neutral-100 bg-white/90 backdrop-blur-sm shadow-sm p-4 md:p-5">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {WORKFLOW_STEPS.map((step, index) => {
              const isDone = index <= progressIndex;

              return (
                <div key={step} className="flex items-center gap-2 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-health-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-neutral-300" />
                  )}
                  <span className={`text-xs font-medium ${isDone ? "text-neutral-900" : "text-neutral-400"}`}>
                    {step}
                  </span>
                  {index < WORKFLOW_STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-neutral-200" />}
                </div>
              );
            })}
          </div>
        </section>

        {statusBanner && (
          <div className="rounded-xl border border-health-200 bg-health-50 px-4 py-3 text-sm text-health-700 animate-pulse-soft">
            {statusBanner}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
          <aside className="md:col-span-1 xl:col-span-3 rounded-[22px] bg-white border border-neutral-100 shadow-sm p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Patients suivis</h2>
              <Users className="h-5 w-5 text-medical-600" />
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {isLoadingPatients
                ? Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />
                  ))
                : contacts.map((patient) => (
                    <button
                      type="button"
                      key={patient.id}
                      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                        selectedPatient?.id === patient.id
                          ? "border-medical-300 bg-gradient-to-r from-medical-50 to-health-50"
                          : "border-neutral-200 bg-white hover:border-medical-200"
                      }`}
                      onClick={() => handleContactSelect(patient)}
                    >
                      <UserCircle2 className="h-8 w-8 text-medical-500" />
                      <span className="font-medium text-neutral-800">{patient.firstName} {patient.lastName}</span>
                    </button>
                  ))}
            </div>
          </aside>

          <section className="md:col-span-1 xl:col-span-5 rounded-[22px] bg-white border border-neutral-100 shadow-sm p-5 space-y-4">
            {selectedPatient ? (
              <>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Créer une ordonnance</h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Patient: <span className="font-medium text-neutral-700">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  </p>
                </div>

                <MedicationSearch onAddMedication={handleAddMedication} />
                <PrescriptionTable medications={selectedMedications} onRemove={handleRemoveMedication} />

                {!idPrescription ? (
                  <button
                    onClick={handleSavePrescription}
                    className="btn-primary w-full"
                  >
                    Créer la prescription
                  </button>
                ) : (
                  <button
                    onClick={handleUpdatePrescription}
                    className="w-full rounded-xl bg-medical-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-medical-700 transition"
                  >
                    Mettre à jour la prescription
                  </button>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center py-20">
                <div>
                  <Users className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium">Sélectionnez un patient</p>
                  <p className="text-sm text-neutral-500">pour démarrer la création de l’ordonnance.</p>
                </div>
              </div>
            )}
          </section>

          <section className="md:col-span-2 xl:col-span-4 rounded-[22px] bg-white border border-neutral-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-medical-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Aperçu ordonnance</h2>
            </div>
            {idPrescription && showPdf ? (
              <PrescriptionForm
                prescriptionId={idPrescription}
                onStatusChange={(status) => {
                  if (status) setPrescriptionStatus(status);
                }}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600 font-medium">Aucune ordonnance affichée</p>
                <p className="text-sm text-neutral-500">Créez une prescription pour voir l’aperçu PDF ici.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
 