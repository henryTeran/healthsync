import React, { useState } from "react";
import { searchMedications } from "../../../shared/services/documedisService"; // 🔹 Importer la fonction qui appelle l'API
import PropTypes from "prop-types";
import { logDebug } from "../../../shared/lib/logger";
import { Search, Sparkles } from "lucide-react";

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
          type: med.atcCode || "Type non précisé",
          indication: med.compactMonographieIndicationDescription || "Indications non précisées",
          packaging: med.smallestArticle?.description || "Conditionnement inconnu",
          company: med.smallestArticle?.companyName || "Laboratoire inconnu",
          interactionBadge: med.compactMonographieIndicationDescription ? "À surveiller" : "Standard",
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
    logDebug("Médicament sélectionné", {
      feature: "medications",
      action: "handleSelectMedication",
      medicationId: medication?.id,
    });
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
      logDebug("Médicament ajouté à la prescription", {
        feature: "medications",
        action: "handleAddToPrescription",
        medicationId: selectedMedication?.id,
      });
      onAddMedication(selectedMedication);
      setSelectedMedication(null);
      setSearchTerm("");
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
      <h3 className="text-base font-semibold text-neutral-900 mb-1">Rechercher un médicament</h3>
      <p className="text-xs text-neutral-500 mb-3">Source données locales (tests) • sélectionnez puis complétez la posologie.</p>

      <div className="relative">
        <Search className="h-4 w-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Rechercher un médicament..."
          className="w-full h-12 rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-medical-500"
        />
      </div>

      {/* 🔹 Affichage du chargement */}
      {loading && <p className="text-gray-500 mt-2">Recherche en cours...</p>}

      {/* 🔹 Gestion des erreurs */}
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* 🔹 Liste des suggestions depuis l'API */}
      {filteredMedications.length > 0 && (
        <ul className="border border-neutral-200 bg-white mt-2 rounded-xl max-h-52 overflow-y-auto shadow-soft">
          {filteredMedications.map((med) => (
            <li
              key={med.id}
              onClick={() => handleSelectMedication(med)}
              className="p-3 hover:bg-medical-50 cursor-pointer transition border-b border-neutral-100 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{med.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px]">{med.dosage}</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-medical-100 text-medical-700 text-[11px]">{med.type}</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-health-100 text-health-700 text-[11px] font-medium">
                  <Sparkles className="h-3 w-3" />
                  {med.interactionBadge}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 Affichage des détails du médicament sélectionné */}
      {selectedMedication && (
        <div className="mt-4 p-4 bg-white border border-medical-200 rounded-xl">
          <h3 className="text-md font-semibold text-neutral-900 mb-3">{selectedMedication.name}</h3>
          <div className="mb-2">
            <label className="text-xs font-medium text-neutral-600">Type :</label>
            <input
              type="text"
              value={selectedMedication.type || ""}
              onChange={(e) => handleMedicationChange("type", e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-neutral-600">Dosage :</label>
            <input
              type="text"
              value={selectedMedication.dosage || ""}
              onChange={(e) => handleMedicationChange("dosage", e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-neutral-600">Fréquence :</label>
            <input
              type="text"
              value={selectedMedication.frequency || ""}
              onChange={(e) => handleMedicationChange("frequency", e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-neutral-600">Durée :</label>
            <input
              type="text"
              value={selectedMedication.duration || ""}
              onChange={(e) => handleMedicationChange("duration", e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-neutral-600">Effets secondaires :</label>
            <textarea
              value={selectedMedication.sideEffects || ""}
              onChange={(e) => handleMedicationChange("sideEffects", e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          <button
            className="mt-2 btn-primary"
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
