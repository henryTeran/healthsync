// src/pages/MedicationPage.jsx
import React, { useEffect, useState } from "react";
import { MedicationSearch } from "../../components/MedicationSearch";
import { PrescriptionTable } from "../../components/PrescriptionTable";
import { savePrescription } from "../../services/prescriptionService";
import { addMedication, deleteMedication, getMedicationsByPrescription } from "../../services/medicationService";
import { useAuth } from "../../contexts/AuthContext";
import { getAuthorizedPatients } from "../../services/doctorServices";
import { UserCircle } from "lucide-react";
import { PrescriptionForm } from "../../components/PrescriptionForm";
import { PrescriptionHistory } from "../../components/PrescriptionHistory";

export const Medications = () => {
  const { user } = useAuth();
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [idPatient, setIdPatient] = useState(""); // ID du patient sélectionné
  const [idPrescription, setIdPrescription] = useState(null);
  const [contacts, setContacts] = useState([]); // Liste des contacts (patients)
  const [selectedPatient, setSelectedPatient] = useState(null); // Patient sélectionné
  const [showFoc, setShowFoc] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

 // Charger les patients suivis par le médecin
 useEffect(() => {
  const fetchPatients = async () => {
    try {
      if (!user || user.userType === "patient") return;
      const contactsData = await getAuthorizedPatients(user.uid);
      setContacts(contactsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des patients :", error);
      throw error;
    }
  };

  fetchPatients();
}, [user]);

  // Gestion de la sélection d'un contact
  const handleContactSelect = (contact) => {
    setIdPatient(contact.id);
    setSelectedPatient(contact);
    setShowFoc(!showFoc);
  };

  const handleAddMedication = (medication) => {
    setSelectedMedications([...selectedMedications, medication]);
  };

  const handleRemoveMedication = (index) => {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    setShowPdf (!showPdf);
    if (!idPatient  || !selectedMedications.length === 0) {
      alert("Veuillez sélectionner un patient et ajouter des médicaments.");
      return;
    }

    try {
      if (idPrescription) {
        // Mettre à jour la prescription existante)
      }else {
        const prescriptionId = await savePrescription(user.uid, idPatient);
        setIdPrescription(prescriptionId);

        // Enregistrer chaque médicament avec l'ID de la prescription
        for (const medication of selectedMedications) {
          await addMedication(prescriptionId, medication);
        }
      }
    } catch (error) {
      alert("Erreur lors de l'enregistrement de la prescription.");
      throw error
    }
  };
     
  const handleUpdatePrescription = async () => {
    setShowPdf (!showPdf);
    
    if (!idPatient  || !selectedMedications.length === 0) {
      alert("Veuillez sélectionner un patient et ajouter des médicaments.");
      return;
    }

    try {
      if (idPrescription) {      
        // Étape 1 : Supprimer tous les médicaments liés à la prescription existante
        const medications = await getMedicationsByPrescription(idPrescription);
        console.log("effacee", idPrescription ,medications);

        const deletePromises = medications.map((med) => { 
          deleteMedication(med.id)
        
          console.log("holaa",med.id);
        });
        await Promise.all(deletePromises);
       
        // Enregistrer chaque médicament avec l'ID de la prescription
        for (const medication of selectedMedications) {
          await addMedication(idPrescription, medication);
        }
        
      }
      //PrescriptionForm.reset();
    } catch (error) {
      alert("Erreur lors de la modifation de la prescription.");
      throw error
    }
  };
  

  return (
    <div className="flex h-screen">
      {/* Bloc 1 : Sidebar - Liste des patients */}
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Liste des patients suivis</h2>
        {contacts.map((patient) => (
          <div
            key={patient.id}
            className={`flex items-center justify-between py-2 px-3 cursor-pointer rounded-lg ${
              selectedPatient?.id === patient.id ? "bg-green-300" : "hover:bg-gray-200"
            }`}
            onClick={() => handleContactSelect(patient)}
          >
            <div className="flex items-center space-x-2">
              <UserCircle className="w-8 h-8 text-gray-500" />
              <span>{patient.firstName} {patient.lastName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bloc 2 : Contenu principal - Création de prescription */}
      <div className="w-1/3 p-6 overflow-y-auto">
        {selectedPatient && (
          <>
            <h2 className="text-xl font-semibold mb-4">Création d’une Prescription</h2>
            <p className="mb-4">
              <strong>Patient :</strong> {selectedPatient.firstName} {selectedPatient.lastName}
            </p>
            {/* Recherche et ajout de médicaments */}
            <MedicationSearch onAddMedication={handleAddMedication} />
            <PrescriptionTable medications={selectedMedications} onRemove={handleRemoveMedication} />
            {/* Bouton pour enregistrer la prescription */}
            {!idPrescription ? (
              <button
                onClick={handleSavePrescription}
                className="mt-4 bg-green-500 text-white p-3 rounded-lg w-full hover:bg-green-600 transition"
              >
                Créer la Prescription
              </button>
              ) : ( 
                <button
                  onClick={handleUpdatePrescription}
                  className="mt-4 bg-blue-500 text-white p-3 rounded-lg w-full hover:bg-green-600 transition"
                >
                Modifier la Prescription
                </button>
              )}
           </>
        )}

        {!selectedPatient && <p>Veuillez sélectionner un patient.</p>}
      </div>

      {/* Bloc 3 : Visualisation de la prescription */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Visualisation de la Prescription</h2>
        {idPrescription && showPdf ? (
          <PrescriptionForm prescriptionId={idPrescription} />
        ) : (
          <p>Aucune prescription créée pour le moment.</p>
        )}
      </div>
    </div>
  );
};
 