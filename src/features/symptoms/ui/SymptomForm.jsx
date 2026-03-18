import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { addSymptom, updateSymptom } from "../../../features/symptoms";
import { useAuth } from "../../../contexts/AuthContext";
import { logError } from "../../../shared/lib/logger";

export const SymptomForm = ({ editingSymptom, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    symptomName: "",
    intensity: "5",
    causes: "",
    notes: "",
  });
  const [editingSymptomId, setEditingSymptomId] = useState(null);

  useEffect(() => {
    if (editingSymptom) {
      setFormData({
        symptomName: editingSymptom.symptomName || "",
        intensity: String(editingSymptom.intensity || 5),
        causes: Array.isArray(editingSymptom.causes)
          ? editingSymptom.causes.join(", ")
          : editingSymptom.causes || "",
        notes: editingSymptom.notes || "",
      });
      setEditingSymptomId(editingSymptom.id);
      return;
    }

    setFormData({ symptomName: "", intensity: "5", causes: "", notes: "" });
    setEditingSymptomId(null);
  }, [editingSymptom]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        symptomName: formData.symptomName,
        intensity: Number(formData.intensity),
        causes: formData.causes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        notes: formData.notes,
        date: new Date().toISOString(),
      };

      if (editingSymptomId) {
        await updateSymptom(editingSymptomId, payload);
        setEditingSymptomId(null);
      } else {
        await addSymptom(user.uid, payload);
      }
      setFormData({ symptomName: "", intensity: "5", causes: "", notes: "" });
      onClose?.();
    } catch (error) {
      logError("Erreur lors de l'ajout/mise à jour du symptôme", error, {
        feature: "symptoms",
        action: "handleSubmit",
        userId: user?.uid,
        symptomId: editingSymptomId,
      });
    }
  };

  return (
    <div className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {editingSymptomId ? "Modifier un symptôme" : "Nouveau symptôme"}
        </h2>
        <p className="text-sm text-neutral-500">Enregistrez précisément l'évolution clinique du patient.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Nom du symptôme</label>
          <input
            type="text"
            name="symptomName"
            placeholder="Ex: céphalée, nausée..."
            value={formData.symptomName}
            onChange={handleChange}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Intensité (1 à 10)</label>
          <input
            type="number"
            min="1"
            max="10"
            name="intensity"
            placeholder="5"
            value={formData.intensity}
            onChange={handleChange}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Causes possibles</label>
          <input
            type="text"
            name="causes"
            placeholder="Séparez par des virgules"
            value={formData.causes}
            onChange={handleChange}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Notes cliniques</label>
        <textarea
          name="notes"
          placeholder="Détails contextuels, facteurs aggravants/soulageants..."
          value={formData.notes}
          onChange={handleChange}
          className="input w-full min-h-[90px]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            {editingSymptomId ? "Mettre à jour" : "Ajouter le symptôme"}
          </button>
        </div>
      </form>
    </div>
  );
};

SymptomForm.propTypes = {
  editingSymptom: PropTypes.shape({
    id: PropTypes.string,
    symptomName: PropTypes.string,
    intensity: PropTypes.number,
    causes: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    notes: PropTypes.string,
  }),
  onClose: PropTypes.func,
};

SymptomForm.defaultProps = {
  editingSymptom: null,
  onClose: undefined,
};
