import React, { useState } from "react";
import { searchMedications } from "../services/documedisService"; // 🔹 Importer la fonction qui appelle l'API
import PropTypes from "prop-types";

export const MedicationSearch = ({ onAddMedication }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Effectuer la requête API Documedis en fonction de la recherche
  const handleSearch = async (event) => {
    const query = event.target.value.trim();
    setSearchTerm(query);
    setError(""); // Réinitialiser les erreurs

    if (query.length > 1) {
      setLoading(true);
      try {
        const results = await searchMedications(query);
         // Vérification et extraction des données pertinentes
         const medications = results?.products?.map((med) => ({
          id: med.productNumber || Math.random(), // Utilisation du productNumber comme identifiant unique
          name: med.description || "Nom inconnu",
          atcCode: med.atcCode || "Code ATC inconnu",
          dosage: med.compactMonographieDosageDescription || "Dosage non précisé",
          indication: med.compactMonographieIndicationDescription || "Indications non précisées",
          packaging: med.smallestArticle?.description || "Conditionnement inconnu",
          company: med.smallestArticle?.companyName || "Laboratoire inconnu"
        }));

        setFilteredMedications(medications);
      } catch (err) {
        setError("Erreur lors de la récupération des médicaments.");
      }
      setLoading(false);
    } else {
      setFilteredMedications([]);
    }
  };

  // 🔹 Sélectionner un médicament et afficher ses détails
  const handleSelectMedication = (medication) => {
    console.log("Médicament sélectionné :", medication);
    setSelectedMedication({ ...medication });
    setSearchTerm(medication.name);
    setFilteredMedications([]); // Fermer la liste des suggestions
  };

  // 🔹 Modifier les détails d'un médicament
  const handleMedicationChange = (field, value) => {
    setSelectedMedication((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 🔹 Ajouter le médicament à la prescription
  const handleAddToPrescription = () => {
    if (selectedMedication) {
      console.log("Médicament ajouté à la prescription :", selectedMedication);
      onAddMedication(selectedMedication);
      setSelectedMedication(null);
      setSearchTerm("");
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

      {/* 🔹 Affichage du chargement */}
      {loading && <p className="text-gray-500 mt-2">Recherche en cours...</p>}

      {/* 🔹 Gestion des erreurs */}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* 🔹 Liste des suggestions depuis l'API */}
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

      {/* 🔹 Affichage des détails du médicament sélectionné */}
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
            <label>Durée :</label>
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
