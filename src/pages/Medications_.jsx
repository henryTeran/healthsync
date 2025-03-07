import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMedicationsByPrescription, updateMedication } from "../services/medicationService";
import { getUserProfile } from "../services/profileService";
import { db } from "../providers/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { calculateEndDate, generateTimes } from "../services/medicationService";


export const Medications_ = () => {
  const { user } = useAuth();

  const [medicationsByDoctor, setMedicationsByDoctor] = useState({});
  const [doctorsInfo, setDoctorsInfo] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);
  const [originalMedication, setOriginalMedication] = useState(null); // Stocker l'original pour annulation

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
    setOriginalMedication(medication); // Sauvegarde avant modification
    setEditingMedication(medication);
  };

  const handleCancelEdit = () => {
    setEditingMedication(null); // Annule la modification
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

  return (
    <div className="p-6 flex space-x-4">
      {/* 🔹 BLOC 1 : MÉDECINS QUI ONT ENVOYÉ UNE PRESCRIPTION */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold">🩺 Médecins</h2>
        <ul>
          {Object.keys(doctorsInfo).map((doctorId) => (
            <li 
              key={doctorId} 
              onClick={() => setSelectedDoctor(doctorId)}
              className={`p-2 cursor-pointer ${selectedDoctor === doctorId ? "bg-blue-500 text-white rounded-lg" : ""}`}
            >
              {doctorsInfo[doctorId]?.firstName} {doctorsInfo[doctorId]?.lastName}
            </li>
          ))}
        </ul>
      </div>

      {/* 🔹 BLOC 2 : LISTE DES PRESCRIPTIONS */}
      {selectedDoctor && (
        <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">📜 Prescriptions</h2>
          <ul>
            {medicationsByDoctor[selectedDoctor]
              .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
              .map(({ prescriptionId, creationDate }) => (
                <li 
                  key={prescriptionId} 
                  onClick={() => setSelectedPrescription(prescriptionId)}
                  className={`p-2 cursor-pointer ${selectedPrescription === prescriptionId ? "bg-blue-500 text-white rounded-lg" : ""}`}
                >
                  Prescription #{prescriptionId} - {new Date(creationDate).toLocaleDateString()}
                </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🔹 BLOC 3 : MÉDICAMENTS ASSOCIÉS À LA PRESCRIPTION */}
      {selectedPrescription && (
        <div className="w-1/2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">💊 Médicaments</h2>
          {medicationsByDoctor[selectedDoctor]
            .find(prescription => prescription.prescriptionId === selectedPrescription)
            .medications.map((med, index) => (
              <div key={index} className="flex flex-col mt-2 border-b pb-4">
                {editingMedication?.id === med.id ? (
                  // 🔥 Mode Édition
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="border rounded p-2 w-full"
                      value={editingMedication.name}
                      onChange={(e) => setEditingMedication({ ...editingMedication, name: e.target.value })}
                    />
                    <input
                      type="text"
                      className="border rounded p-2 w-full"
                      value={editingMedication.dosage}
                      onChange={(e) => setEditingMedication({ ...editingMedication, dosage: e.target.value })}
                    />
                    <input
                      type="text"
                      className="border rounded p-2 w-full"
                      value={editingMedication.frequency}
                      onChange={(e) => setEditingMedication({ ...editingMedication, frequency: e.target.value })}
                    />
                    <input
                      type="date"
                      className="border rounded p-2 w-full"
                      value={editingMedication.startDate}
                      onChange={(e) => setEditingMedication({ ...editingMedication, startDate: e.target.value })}
                    />
                    <input
                      type="text"
                      className="border rounded p-2 w-full"
                      value={editingMedication.duration}
                      onChange={(e) => setEditingMedication({ ...editingMedication, duration: e.target.value })}
                    />
                    <div className="flex space-x-2">
                      <button onClick={handleSaveMedication} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                        ✅ Sauvegarder
                      </button>
                      <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 w-full">
                        ❌ Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold">{med.name}</p>
                    <p>{med.dosage} - {med.frequency}</p>
                    <p>📅 Début: {med.startDate} | Fin: {med.endDate}</p>
                    <button
                      onClick={() => handleEditMedication(med)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                    >
                      ✏️ Modifier
                    </button>
                  </>
                )}
              </div>
            ))}
  
          <br />
          {/* <MedicationGantt medications={medicationsByDoctor[selectedDoctor].find(prescription => prescription.prescriptionId === selectedPrescription).medications} /> */}
          {/* <MedicationGanttPage user={user}/> */}
        </div>
        
      )}
    </div>
  );
};
