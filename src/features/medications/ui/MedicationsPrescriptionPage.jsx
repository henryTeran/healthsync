import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { MedicationCard } from "./MedicationCard";
import {
  calculateEndDate,
  generateTimes,
  getMedicationsByPrescription,
  updateMedication,
} from "../../../features/medications";
import { getUserProfile } from "../../../features/profile";
import { db } from "../../../providers/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { 
  Pill, 
  User, 
  FileText,
  Search
} from "lucide-react";

export const MedicationsPrescriptionPage = () => {
  const { user } = useAuth();
  const [medicationsByDoctor, setMedicationsByDoctor] = useState({});
  const [doctorsInfo, setDoctorsInfo] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserMedications();
    }
  }, [user]);

  const fetchUserMedications = async () => {
    if (!user) return;

    const q = query(collection(db, "prescriptions"), where("patientId", "==", user.uid), where("status", "==", "received"));
    const snapshot = await getDocs(q);
    let allPrescriptions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let groupedMedications = {};
    let doctors = {};

    for (let prescription of allPrescriptions) {
      const medications = await getMedicationsByPrescription(prescription.id);
      const doctorId = prescription.createdBy;

      if (!groupedMedications[doctorId]) {
        groupedMedications[doctorId] = [];
      }
      groupedMedications[doctorId].push({ prescriptionId: prescription.id, medications, creationDate: prescription.creationDate });

      if (!doctors[doctorId]) {
        doctors[doctorId] = await getUserProfile(doctorId);
      }
    }

    setMedicationsByDoctor(groupedMedications);
    setDoctorsInfo(doctors);
  };

  const handleEditMedication = (medication) => {
    setEditingMedication(medication);
  };

  const handleSaveMedication = async () => {
    if (!editingMedication) return;

    const { id, name, dosage, frequency, startDate, duration } = editingMedication;
    const newEndDate = calculateEndDate(startDate, duration);
    const newTimes = generateTimes(frequency);

    await updateMedication(id, {
      name,
      dosage,
      frequency,
      startDate,
      duration, // On garde la durée en texte (ex: "2 semaines")
      endDate: newEndDate,
      times: newTimes,
    });

    setEditingMedication(null);
    fetchUserMedications();
  };

  const handleDeleteMedication = async (medication) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      try {
        // Logique de suppression à implémenter
        console.log('Suppression du médicament:', medication.id);
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
      }
    }
  };

  const filteredDoctors = Object.keys(doctorsInfo).filter(doctorId => {
    const doctor = doctorsInfo[doctorId];
    return `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient mb-2">Mes Médicaments</h1>
          <p className="text-neutral-600">Gérez vos traitements et prescriptions</p>
        </div>

        {/* Interface principale */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Médecins */}
          <div className="lg:col-span-1">
            <div className="card-medical p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-800">Médecins</h2>
                <User className="h-5 w-5 text-medical-500" />
              </div>
              
              {/* Recherche */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {filteredDoctors.map((doctorId) => (
                  <button
                    key={doctorId}
                    onClick={() => setSelectedDoctor(doctorId)}
                    className={`w-full p-3 text-left rounded-xl transition-all duration-200 ${
                      selectedDoctor === doctorId
                        ? "bg-medical-100 text-medical-700 border-2 border-medical-300"
                        : "hover:bg-neutral-50 border-2 border-transparent"
                    }`}
                  >
                    <div className="font-medium">
                      Dr. {doctorsInfo[doctorId]?.firstName} {doctorsInfo[doctorId]?.lastName}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {medicationsByDoctor[doctorId]?.length || 0} prescription{medicationsByDoctor[doctorId]?.length > 1 ? 's' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            {selectedDoctor ? (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Prescriptions */}
                <div className="xl:col-span-1">
                  <div className="card-medical p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-neutral-800">Prescriptions</h3>
                      <FileText className="h-5 w-5 text-medical-500" />
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                      {medicationsByDoctor[selectedDoctor]
                        ?.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
                        .map(({ prescriptionId, creationDate }) => (
                          <button
                            key={prescriptionId}
                            onClick={() => setSelectedPrescription(prescriptionId)}
                            className={`w-full p-4 text-left rounded-xl transition-all duration-200 ${
                              selectedPrescription === prescriptionId
                                ? "bg-health-100 text-health-700 border-2 border-health-300"
                                : "bg-white border-2 border-neutral-200 hover:border-medical-300"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-health-400 to-health-500 rounded-xl flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="font-medium">Prescription #{prescriptionId.slice(-6)}</div>
                                <div className="text-sm text-neutral-500">
                                  {new Date(creationDate).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Médicaments */}
                <div className="xl:col-span-2">
                  {selectedPrescription ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-neutral-800">Médicaments</h3>
                        <div className="flex items-center space-x-2">
                          <Pill className="h-5 w-5 text-medical-500" />
                          <span className="text-sm text-neutral-600">
                            {medicationsByDoctor[selectedDoctor]
                              ?.find(prescription => prescription.prescriptionId === selectedPrescription)
                              ?.medications.length || 0} médicament{medicationsByDoctor[selectedDoctor]
                              ?.find(prescription => prescription.prescriptionId === selectedPrescription)
                              ?.medications.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        {medicationsByDoctor[selectedDoctor]
                          ?.find(prescription => prescription.prescriptionId === selectedPrescription)
                          ?.medications.map((med) => (
                            <div key={med.id}>
                              {editingMedication?.id === med.id ? (
                                // Mode édition
                                <div className="card-medical p-6">
                                  <h4 className="text-lg font-semibold mb-4">Modifier le médicament</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-2">Nom</label>
                                      <input
                                        type="text"
                                        className="input w-full"
                                        value={editingMedication.name}
                                        onChange={(e) => setEditingMedication({ ...editingMedication, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-2">Dosage</label>
                                      <input
                                        type="text"
                                        className="input w-full"
                                        value={editingMedication.dosage}
                                        onChange={(e) => setEditingMedication({ ...editingMedication, dosage: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-2">Fréquence</label>
                                      <input
                                        type="text"
                                        className="input w-full"
                                        value={editingMedication.frequency}
                                        onChange={(e) => setEditingMedication({ ...editingMedication, frequency: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-neutral-700 mb-2">Date de début</label>
                                      <input
                                        type="date"
                                        className="input w-full"
                                        value={editingMedication.startDate}
                                        onChange={(e) => setEditingMedication({ ...editingMedication, startDate: e.target.value })}
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-medium text-neutral-700 mb-2">Durée</label>
                                      <input
                                        type="text"
                                        className="input w-full"
                                        value={editingMedication.duration}
                                        onChange={(e) => setEditingMedication({ ...editingMedication, duration: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end space-x-3 mt-6">
                                    <button 
                                      onClick={() => setEditingMedication(null)}
                                      className="btn-secondary"
                                    >
                                      Annuler
                                    </button>
                                    <button 
                                      onClick={handleSaveMedication}
                                      className="btn-primary"
                                    >
                                      Sauvegarder
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Mode affichage
                                <MedicationCard
                                  medication={med}
                                  onEdit={handleEditMedication}
                                  onDelete={handleDeleteMedication}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="card-medical p-12 text-center">
                      <FileText className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                        Sélectionnez une prescription
                      </h3>
                      <p className="text-neutral-500">
                        Choisissez une prescription pour voir les médicaments associés
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card-medical p-12 text-center">
                <User className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                  Sélectionnez un médecin
                </h3>
                <p className="text-neutral-500">
                  Choisissez un médecin pour voir vos prescriptions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
