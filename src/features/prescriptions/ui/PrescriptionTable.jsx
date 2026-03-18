import React from "react";
import PropTypes from "prop-types";
import { Pill, Trash2 } from "lucide-react";




export const PrescriptionTable = ({ medications, onRemove }) => {
  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-800 mb-1">Médicaments sélectionnés</h2>
      <p className="text-sm text-neutral-600 mb-4">Vérifiez la prescription avant génération PDF et envoi patient.</p>
      {medications.length > 0 ? (
        <div className="space-y-3">
          {medications.map((med, index) => (
            <article
              key={`${med.name}-${index}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-4 hover:border-medical-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-medical-100 text-medical-700 flex items-center justify-center shrink-0">
                    <Pill className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-neutral-900 truncate">{med.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                        {med.dosage}
                      </span>
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-medical-100 text-medical-700">
                        {med.frequency}
                      </span>
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-health-100 text-health-700">
                        {med.duration}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                  onClick={() => onRemove(index)}
                  aria-label={`Supprimer ${med.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          Aucun médicament ajouté.
        </div>
      )}
    </div>
  );
};

PrescriptionTable.propTypes = {
    medications: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        dosage: PropTypes.string.isRequired,
        frequency: PropTypes.string.isRequired,
        duration: PropTypes.string.isRequired,
      })
    ).isRequired,
    onRemove: PropTypes.func.isRequired,
  };

  // PrescriptionTable.defaultProps = {
  //   medications: [],
  //};