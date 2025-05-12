import React, { useState, useEffect } from "react";
import { getPrescriptionsByPatient } from "../../services/prescriptionService";
import { getAuthorizedPatients } from "../../services/doctorServices";
import { useAuth } from "../../contexts/AuthContext";
import { UserCircle } from "lucide-react";

export const PrescriptionHistory = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

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
    try {
      const prescriptionsData = await getPrescriptionsByPatient(patient.id);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des prescriptions :", error);
    }
  };

  const handleSelectPrescription = (prescription) => {
    setSelectedPrescription(prescription);
  };

  return (
    <div className="flex h-screen">
      {/* Bloc 1 : Liste des patients */}
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Patients suivis</h2>
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`flex items-center justify-between py-2 px-3 cursor-pointer rounded-lg ${
              selectedPatient?.id === patient.id ? "bg-green-300" : "hover:bg-gray-200"
            }`}
            onClick={() => handleSelectPatient(patient)}
          >
            <div className="flex items-center space-x-2">
              <UserCircle className="w-8 h-8 text-gray-500" />
              <span>{patient.firstName} {patient.lastName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bloc 2 : Liste des prescriptions */}
      <div className="w-1/3 p-6 overflow-y-auto">
        {selectedPatient ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Ordonnances</h2>
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="border p-3 rounded mb-2 cursor-pointer" onClick={() => handleSelectPrescription(prescription)}>
                <p><strong>Date :</strong> {new Date(prescription.creationDate).toLocaleDateString()}</p>
                <p><strong>Statut :</strong> {prescription.status || "En attente"}</p>
              </div>
            ))}
          </>
        ) : (
          <p>Sélectionnez un patient.</p>
        )}
      </div>

      {/* Bloc 3 : Affichage du PDF */}
      <div className="w-1/2 p-6">
        {selectedPrescription && selectedPrescription.pdfUrl ? (
          <iframe src={selectedPrescription.pdfUrl} className="w-full h-full" title="Ordonnance PDF"></iframe>
        ) : (
          <p>Sélectionnez une ordonnance pour voir le PDF.</p>
        )}
      </div>
    </div>
  );
};
