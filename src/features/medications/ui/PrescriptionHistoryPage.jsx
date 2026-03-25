import { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { getPrescriptionById, getPrescriptionsByPatient } from "../../../features/prescriptions";
import { getAuthorizedPatients, getUserProfile } from "../../../features/profile";
import { useAuth } from "../../../contexts/AuthContext";
import { logError } from "../../../shared/lib/logger";
import {
  EmptyStateMedical,
  PatientCard,
  PrescriptionDocumentPreview,
  PrescriptionPreviewPanel,
  TimelineEventCard,
} from "./components/MedicalUiComponents";

const statusToLabel = (status) => {
  if (!status) return "en attente";
  if (status === "created") return "brouillon";
  if (status === "pdf_generated") return "brouillon";
  if (status === "sent") return "envoyé";
  if (status === "received") return "reçu";
  if (status === "validated_by_patient") return "validé";
  if (status === "active") return "actif";
  if (status === "completed") return "terminé";
  return status;
};

export const PrescriptionHistoryPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedPrescriptionDetails, setSelectedPrescriptionDetails] = useState(null);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user || user.userType !== "doctor") return;
      const contactsData = await getAuthorizedPatients(user.uid);
      setPatients(contactsData);
    };

    fetchPatients();
  }, [user]);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setSelectedPrescription(null);
    setSelectedPrescriptionDetails(null);
    setSelectedDoctorProfile(null);

    try {
      const prescriptionsData = await getPrescriptionsByPatient(patient.id);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      logError("Erreur lors de la récupération des prescriptions", error, {
        feature: "medications",
        action: "handleSelectPatient",
        patientId: patient?.id,
      });
    }
  };

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      }),
    [patients, searchTerm]
  );

  const sortedPrescriptions = useMemo(
    () => [...prescriptions].sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate)),
    [prescriptions]
  );

  useEffect(() => {
    const loadPrescriptionDetails = async () => {
      if (!selectedPrescription?.id) {
        setSelectedPrescriptionDetails(null);
        setSelectedDoctorProfile(null);
        return;
      }

      try {
        const details = await getPrescriptionById(selectedPrescription.id);
        setSelectedPrescriptionDetails(details);

        if (details?.createdBy) {
          const doctor = await getUserProfile(details.createdBy);
          setSelectedDoctorProfile(doctor);
        }
      } catch (error) {
        logError("Erreur chargement détail ordonnance historique", error, {
          feature: "medications",
          action: "loadPrescriptionDetails",
          prescriptionId: selectedPrescription?.id,
        });
      }
    };

    loadPrescriptionDetails();
  }, [selectedPrescription?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Historique des ordonnances</h1>
            <p className="text-sm text-neutral-500 mt-1">Visualisez l&apos;évolution des prescriptions par patient et consultez les documents cliniques.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Patients</p>
              <p className="text-2xl font-semibold text-neutral-900">{patients.length}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Ordonnances</p>
              <p className="text-2xl font-semibold text-neutral-900">{prescriptions.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-3 rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 sm:p-5 space-y-4">
            <h2 className="text-neutral-900 font-semibold">Patients suivis</h2>

            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un patient"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 text-sm focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 outline-none"
              />
            </label>

            <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  selected={selectedPatient?.id === patient.id}
                  onSelect={handleSelectPatient}
                  compact
                />
              ))}

              {filteredPatients.length === 0 ? (
                <EmptyStateMedical
                  title="Aucun patient"
                  description="Aucun résultat avec ce filtre de recherche."
                />
              ) : null}
            </div>
          </aside>

          <section className="xl:col-span-5 rounded-[20px] border border-neutral-100 bg-white shadow-sm p-4 sm:p-6 space-y-4">
            <h2 className="text-neutral-900 font-semibold text-xl">Timeline des ordonnances</h2>

            {selectedPatient ? (
              sortedPrescriptions.length > 0 ? (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {sortedPrescriptions.map((prescription) => (
                    <TimelineEventCard
                      key={prescription.id}
                      title={`Ordonnance #${prescription.id.slice(-6)}`}
                      date={new Date(prescription.creationDate).toLocaleDateString("fr-FR")}
                      status={statusToLabel(prescription.status)}
                      author={`Dr ${user?.displayName || "HealthSync"}`}
                      medicationsCount={prescription.medications?.length || 0}
                      description="Document clinique généré pour le suivi thérapeutique du patient."
                      selected={selectedPrescription?.id === prescription.id}
                      onSelect={() => setSelectedPrescription(prescription)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStateMedical
                  title="Aucune ordonnance"
                  description="Ce patient n'a pas encore d'historique d'ordonnances disponible."
                />
              )
            ) : (
              <EmptyStateMedical
                title="Sélectionnez un patient"
                description="La timeline s'affiche ici après sélection d'un patient à gauche."
              />
            )}
          </section>

          <aside className="xl:col-span-4 xl:sticky xl:top-24 self-start">
            <PrescriptionPreviewPanel
              title="Aperçu document"
              subtitle="Lecture réaliste du document clinique A4 et accès PDF source."
              status={statusToLabel(selectedPrescription?.status)}
              sticky
              actions={
                selectedPrescription?.pdfUrl ? (
                  <a
                    href={selectedPrescription.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 px-5 inline-flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" /> Ouvrir dans un onglet
                  </a>
                ) : null
              }
            >
              {selectedPrescriptionDetails ? (
                <div className="max-h-[70vh] overflow-auto rounded-[20px] bg-neutral-50 p-3">
                  <PrescriptionDocumentPreview
                    prescription={selectedPrescriptionDetails}
                    patient={selectedPatient}
                    doctor={selectedDoctorProfile}
                  />
                </div>
              ) : (
                <EmptyStateMedical
                  title="Aucun document affiché"
                  description="Sélectionnez un événement de la timeline pour prévisualiser son ordonnance PDF."
                />
              )}
            </PrescriptionPreviewPanel>
          </aside>
        </div>
    </div>
  );
};
