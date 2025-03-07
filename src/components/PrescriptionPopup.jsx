import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { addMedicationToUser, calculateEndDate, generateTimes } from "../services/medicationService";
import { useAuth } from "../contexts/AuthContext";

export const PrescriptionPopup = ({ medications, prescriptionId, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addedMedications, setAddedMedications] = useState([]);
  const [startDates, setStartDates] = useState({});
  const [errors, setErrors] = useState({}); // Gestion des erreurs

  // 🔹 Mise à jour de la date de début
  const handleStartDateChange = (med, date) => {
    setStartDates((prev) => ({ ...prev, [med.name]: date }));
    setErrors((prev) => ({ ...prev, [med.name]: "" })); // Efface l'erreur si une date est sélectionnée
  };

  // 🔹 Ajout du médicament avec validation
  const handleAddToTracking = async (med) => {
    if (!user) return;

    const startDate = startDates[med.name];

    if (!startDate) {
      setErrors((prev) => ({ ...prev, [med.name]: "Veuillez sélectionner une date de début." }));
      return;
    }

    console.log(med, "📌 Date de début :", startDate, "Durée :", med.duration, "idPrescription :", prescriptionId);
    await addMedicationToUser(med, startDate, med.duration, prescriptionId);

    // ✅ Mise à jour de l'affichage
    setAddedMedications((prev) => [...prev, med.name]);
  };

  // 🔹 Fermer et synchroniser les données sur la page "medications"
  const handleClose = () => {
    navigate("/medications_", { state: { reload: true } }); // Redirection avec signal de rafraîchissement
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg">
        <h2 className="text-xl font-bold mb-4">📜 Médicaments reçus</h2>

        {medications.map((med, index) => (
          <div key={index} className="flex flex-col p-2 border-b">
            <span>{med.name} - {med.dosage} ({med.frequency})</span>

            {/* Sélection de la date de début */}
            <label className="text-sm text-gray-600 mt-2">📅 Date de début :</label>
            <input
              type="date"
              className="border rounded p-1 mt-1"
              value={startDates[med.name] || ""}
              onChange={(e) => handleStartDateChange(med, e.target.value)}
            />
            {errors[med.name] && <span className="text-red-500 text-sm">{errors[med.name]}</span>}

            {/* Affichage de la date de fin automatique */}
            <label className="text-sm text-gray-600 mt-2">📅 Date de fin :</label>
            <input
              type="text"
              className="border rounded p-1 mt-1 bg-gray-100"
              value={calculateEndDate(startDates[med.name] || new Date().toISOString().split("T")[0], med.duration)}
              readOnly
            />

            {/* Affichage des horaires générés automatiquement */}
            <label className="text-sm text-gray-600 mt-2">⏰ Horaires :</label>
            <div className="flex space-x-2 mt-1">
              {generateTimes(med.frequency).map((time, idx) => (
                <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm">{time}</span>
              ))}
            </div>

            {/* Bouton Ajouter */}
            <button
              className={`mt-2 px-3 py-1 text-white rounded ${
                addedMedications.includes(med.name) ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={() => handleAddToTracking(med)}
              disabled={addedMedications.includes(med.name)}
            >
              {addedMedications.includes(med.name) ? "Ajouté ✅" : "Ajouter"}
            </button>
          </div>
        ))}

        <button onClick={handleClose} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Fermer
        </button>
      </div>
    </div>
  );
};

PrescriptionPopup.propTypes = {
  medications: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  prescriptionId: PropTypes.string.isRequired,
};
