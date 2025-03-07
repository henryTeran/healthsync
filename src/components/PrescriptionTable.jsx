// src/components/PrescriptionTable.jsx
import React from "react";
import PropTypes from "prop-types";




export const PrescriptionTable = ({ medications, onRemove }) => {
  return (
    <div className="mt-6 p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Médicaments sélectionnés</h2>
      {medications.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Nom</th>
              <th className="border p-2">Dosage</th>
              <th className="border p-2">Fréquence</th>
              <th className="border p-2">Durant</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, index) => (
              <tr key={index}>
                <td className="border p-2">{med.name}</td>
                <td className="border p-2">{med.dosage}</td>
                <td className="border p-2">{med.frequency}</td>
                <td className="border p-2">{med.duration}</td>
                <td className="border p-2">
                  <button
                    className="bg-red-500 text-white p-1 rounded"
                    onClick={() => onRemove(index)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Aucun médicament ajouté.</p>
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