import React, { useEffect, useState } from "react";
import { getPrescriptionsByUser } from "../services/prescriptionService";
import { useAuth } from "../contexts/AuthContext";
import { Eye, Download } from "lucide-react";

export const PrescriptionHistory = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const userPrescriptions = await getPrescriptionsByUser(user.uid);
      setPrescriptions(userPrescriptions);
    } catch (error) {
      console.error("Erreur lors de la récupération des prescriptions :", error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Historique des Ordonnances</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Date</th>
            <th className="border p-2">Patient</th>
            <th className="border p-2">Statut</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {prescriptions.map((prescription) => (
            <tr key={prescription.id}>
              <td className="border p-2">{new Date(prescription.creationDate).toLocaleDateString()}</td>
              <td className="border p-2">{prescription.patientName}</td>
              <td className="border p-2">{prescription.status}</td>
              <td className="border p-2 flex space-x-2">
                <a href={prescription.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <button className="bg-blue-500 text-white p-2 rounded flex items-center">
                    <Eye className="w-4 h-4 mr-1" /> Voir
                  </button>
                </a>
                <a href={prescription.pdfUrl} download>
                  <button className="bg-green-500 text-white p-2 rounded flex items-center">
                    <Download className="w-4 h-4 mr-1" /> Télécharger
                  </button>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
