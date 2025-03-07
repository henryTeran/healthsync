import React, { useState, useEffect } from "react";
import { addSymptom, getSymptomsByUserRealtime, updateSymptom, deleteSymptom } from "../services/symptomService";
import { useAuth } from "../contexts/AuthContext";


export const SymptomForm = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState([]);
  const [formData, setFormData] = useState({ symptomName: "", intensity: "", causes: "", notes: "" });
  const [editingSymptomId, setEditingSymptomId] = useState(null);

  useEffect(() => {
    if (user) {
        const unsubscribe = getSymptomsByUserRealtime(user.uid, (userSymptoms) => {
            setSymptoms(sortSymptoms(userSymptoms));
          });
          return () => unsubscribe(); // Arrête l'écoute lorsque le composant est démonté
    }
  }, [user]);

  const fetchSymptoms = async () => {
    try {
      const userSymptoms = await getSymptomsByUser(user.uid);
      const sortedSymptoms = sortSymptoms(userSymptoms);
      setSymptoms(sortedSymptoms);
    } catch (error) {
      console.error("Erreur lors de la récupération des symptômes :", error);
    }
  };

  const sortSymptoms = (symptoms) => {
    // Regrouper les symptômes par symptomName
    const groupedSymptoms = symptoms.reduce((acc, symptom) => {
      if (!acc[symptom.symptomName]) {
        acc[symptom.symptomName] = [];
      }
      acc[symptom.symptomName].push(symptom);
      return acc;
    }, {});

    // Trier chaque groupe par date décroissante
    Object.keys(groupedSymptoms).forEach((key) => {
      groupedSymptoms[key].sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return groupedSymptoms;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSymptomId) {
        await updateSymptom(editingSymptomId, formData);
        setEditingSymptomId(null);
      } else {
        await addSymptom(user.uid, { ...formData, date: new Date().toISOString() });
      }
      setFormData({ symptomName: "", intensity: "", causes: "", notes: "" });
      fetchSymptoms();
    } catch (error) {
      console.error("Erreur lors de l'ajout/mise à jour du symptôme :", error);
    }
  };

  const handleEdit = (symptom) => {
    setFormData({
      symptomName: symptom.symptomName,
      intensity: symptom.intensity,
      causes: symptom.causes,
      notes: symptom.notes,
    });
    setEditingSymptomId(symptom.id);
  };

  const handleDelete = async (symptomId) => {
    try {
      await deleteSymptom(symptomId);
      fetchSymptoms();
    } catch (error) {
      console.error("Erreur lors de la suppression du symptôme :", error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">Suivi des Symptômes</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="symptomName"
          placeholder="Nom du symptôme"
          value={formData.symptomName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          name="intensity"
          placeholder="Intensité (1-10)"
          value={formData.intensity}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="causes"
          placeholder="Possibles causes"
          value={formData.causes}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="notes"
          placeholder="Notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        ></textarea>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          {editingSymptomId ? "Mettre à jour" : "Ajouter"}
        </button>
      </form>

      {/* Liste des symptômes classés */}
      <h3 className="text-md font-semibold mt-6">Historique des Symptômes</h3>
      <div className="mt-4">
        {Object.keys(symptoms).length > 0 ? (
          Object.entries(symptoms).map(([symptomName, symptomList]) => (
            <div key={symptomName} className="mb-6">
              <h4 className="text-lg font-bold text-blue-600">{symptomName}</h4>
              <ul className="mt-2 space-y-2">
                {symptomList.map((symptom) => (
                  <li
                    key={symptom.id}
                    className="flex justify-between items-center bg-gray-100 p-3 rounded"
                  >
                    <div>
                      <p className="text-sm">
                        <span className="font-bold">Intensité :</span> {symptom.intensity}
                      </p>
                      <p className="text-sm">
                        <span className="font-bold">Causes :</span> {symptom.causes}
                      </p>
                      <p className="text-sm">
                        <span className="font-bold">Notes :</span> {symptom.notes}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(symptom.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleEdit(symptom)}
                        className="bg-yellow-500 text-white p-2 rounded"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(symptom.id)}
                        className="bg-red-500 text-white p-2 rounded"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Aucun symptôme enregistré.</p>
        )}
      </div>
    </div>
  );
};
