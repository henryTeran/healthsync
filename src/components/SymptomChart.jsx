import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useAuth } from "../contexts/AuthContext";
import { getSymptomsByUserRealtime } from "../services/symptomService";
import { getAuthorizedPatients } from "../services/doctorServices";

// Importation de Chart.js et des composants nécessaires
import { Chart as ChartJS, registerables } from "chart.js";
import "chartjs-adapter-date-fns"; // Adaptateur pour l'axe du temps

// Enregistrement des composants Chart.js
ChartJS.register(...registerables);

export const SymptomChart = () => {
  const { user, role } = useAuth();
  const [symptoms, setSymptoms] = useState([]);
  const [colors, setColors] = useState({});
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [type, setType] = useState(null);

  // 🎨 Palette de couleurs fixes avec plus de diversité
  const predefinedColors = [
    "#E63946", "#F4A261", "#2A9D8F", "#264653", "#A8DADC", "#457B9D", "#E76F51", "#6A0572",
    "#1D3557", "#F77F00", "#A663CC", "#D62828", "#F9844A", "#06D6A0", "#EF476F",
    "#118AB2", "#073B4C", "#FFD166", "#A8D5BA", "#9C6644"
  ];

  useEffect(() => {
    if (!user) return;
    setType(user.userType);

    if (user.userType === "doctor") {
      fetchPatients();
    } else {
      fetchSymptoms(user.uid);
    }
  }, [user, user.userType]);

  const fetchPatients = async () => {
    const doctorPatients = await getAuthorizedPatients(user.uid);
    setPatients(doctorPatients);
  };

  const fetchSymptoms = async (userId) => {
    const unsubscribe = getSymptomsByUserRealtime(userId, (updatedSymptoms) => {
      setSymptoms(updatedSymptoms);
      generateUniqueColors(updatedSymptoms);
    });

    return () => unsubscribe();
  };

  // 🎨 Génération de couleurs uniques pour éviter les doublons
  const generateUniqueColors = (symptoms) => {
    const uniqueSymptoms = [...new Set(symptoms.map((s) => s.symptomName))];

    setColors((prevColors) => {
      let newColors = { ...prevColors };
      let usedColors = new Set(Object.values(newColors)); // Couleurs déjà attribuées

      uniqueSymptoms.forEach((symptom) => {
        if (!newColors[symptom]) {
          let availableColors = predefinedColors.filter(color => !usedColors.has(color));

          if (availableColors.length > 0) {
            newColors[symptom] = availableColors[0];
          } else {
            let randomColor;
            do {
              randomColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
            } while (usedColors.has(randomColor));
            newColors[symptom] = randomColor;
          }
          usedColors.add(newColors[symptom]); // Ajouter la couleur utilisée
        }
      });

      return newColors;
    });
  };

  const getSymptomData = () => {
    const groupedSymptoms = {};

    symptoms.forEach((symptom) => {
      if (!groupedSymptoms[symptom.symptomName]) {
        groupedSymptoms[symptom.symptomName] = [];
      }
      groupedSymptoms[symptom.symptomName].push({
        x: new Date(symptom.date),
        y: symptom.intensity,
      });
    });

    Object.keys(groupedSymptoms).forEach((symptomName) => {
      groupedSymptoms[symptomName].sort((a, b) => a.x - b.x);
    });

    return Object.keys(groupedSymptoms).map((symptomName) => ({
      label: symptomName,
      data: groupedSymptoms[symptomName],
      borderColor: colors[symptomName] || "gray",
      fill: false,
    }));
  };

  const data = {
    datasets: getSymptomData(),
  };

  const options = {
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
        },
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Intensité",
        },
      },
    },
  };

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold">📊 Évolution des Symptômes</h3>

      {/* 🔹 Sélecteur de patient pour un médecin */}
      {user.userType === "doctor" && (
        <div className="mb-4">
          <label className="block text-sm font-medium">👥 Sélectionnez un patient :</label>
          <select
            className="w-full mt-2 p-2 border rounded-lg"
            onChange={(e) => {
              setSelectedPatient(e.target.value);
              fetchSymptoms(e.target.value);
            }}
            value={selectedPatient || ""}
          >
            <option value="" disabled>-- Choisissez un patient --</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.firstName} {patient.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 🔹 Affichage du graphique */}
      {symptoms.length > 0 ? (
        <Line key={JSON.stringify(data)} data={data} options={options} />
      ) : (
        <p className="text-gray-500">Aucun symptôme enregistré pour le moment.</p>
      )}
    </div>
  );
};
