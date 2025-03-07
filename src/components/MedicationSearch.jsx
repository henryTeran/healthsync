import React, { useState } from "react";
import { simulationMedicationsCompendium } from "../data/simulationMedicationsCompendium"; // Simule une base de données locale
import PropTypes from "prop-types";

export const MedicationSearch = ({ onAddMedication }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [filteredMedications, setFilteredMedications] = useState([]);

  // Filtrer les médicaments en fonction de la recherche
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchTerm(query);
    if (query.length > 1) {
      const results = simulationMedicationsCompendium.filter((med) =>
        med.name.toLowerCase().includes(query)
      );
      setFilteredMedications(results);
    } else {
      setFilteredMedications([]);
    }
  };

  // Sélectionner un médicament et afficher ses détails
  const handleSelectMedication = (medication) => {
    console.log("Médicament sélectionné :", medication);
    setSelectedMedication({ ...medication }); // Créer une copie pour éviter la modification directe
    setSearchTerm(medication.name);
    setFilteredMedications([]);
  };

  // Gérer les modifications des champs du médicament sélectionné
  const handleMedicationChange = (field, value) => {
    if (selectedMedication) {
      setSelectedMedication((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Ajouter le médicament modifié à la prescription
  const handleAddToPrescription = () => {
    if (selectedMedication) {
      console.log("Médicament ajouté à la prescription :", selectedMedication);
      onAddMedication(selectedMedication);
      setSelectedMedication(null); // Réinitialiser après ajout
      setSearchTerm(""); // Réinitialiser la recherche
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Rechercher un médicament</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Nom du médicament..."
        className="w-full p-2 border rounded"
      />
      {/* Liste des suggestions */}
      {filteredMedications.length > 0 && (
        <ul className="border border-gray-300 mt-2 rounded">
          {filteredMedications.map((med) => (
            <li
              key={med.id}
              onClick={() => handleSelectMedication(med)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {med.name}
            </li>
          ))}
        </ul>
      )}
      {/* Détails du médicament sélectionné avec édition */}
      {selectedMedication && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="text-md font-semibold">{selectedMedication.name}</h3>
          <div className="mb-2">
            <label>Type :</label>
            <input
              type="text"
              value={selectedMedication.type || ""}
              onChange={(e) => handleMedicationChange("type", e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <div className="mb-2">
            <label>Dosage :</label>
            <input
              type="text"
              value={selectedMedication.dosage || ""}
              onChange={(e) => handleMedicationChange("dosage", e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <div className="mb-2">
            <label>Fréquence :</label>
            <input
              type="text"
              value={selectedMedication.frequency || ""}
              onChange={(e) => handleMedicationChange("frequency", e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <div className="mb-2">
            <label>Durant :</label>
            <input
              type="text"
              value={selectedMedication.duration || ""}
              onChange={(e) => handleMedicationChange("duration", e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <div className="mb-2">
            <label>Effets secondaires :</label>
            <textarea
              value={selectedMedication.sideEffects || ""}
              onChange={(e) => handleMedicationChange("sideEffects", e.target.value)}
              className="w-full p-1 border rounded"
            />
          </div>
          <button
            className="mt-2 bg-blue-500 text-white p-2 rounded"
            onClick={handleAddToPrescription}
          >
            Ajouter à la prescription
          </button>
        </div>
      )}
    </div>
  );
};

MedicationSearch.propTypes = {
  onAddMedication: PropTypes.func.isRequired,
};