import React, { useEffect, useState } from "react";
import { getMedicationsByPrescription } from "../services/medicationService";
import { getUserProfile } from "../services/profileService";
import { db } from "../providers/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

// 🔹 Génération de couleurs uniques pour médecins et prescriptions
const generateColor = (index) => {
  const colors = ["#4F46E5", "#22C55E", "#E11D48", "#F59E0B", "#8B5CF6", "#10B981", "#EC4899", "#14B8A6"];
  return colors[index % colors.length];
};

export const MedicationGanttPage = () => {
  const [chartData, setChartData] = useState([]);
  const [doctorColors, setDoctorColors] = useState({});
  const [prescriptionColors, setPrescriptionColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeDomain, setTimeDomain] = useState([null, null]);

  useEffect(() => {
    fetchAllMedications();
  }, []);

  const fetchAllMedications = async () => {
    setLoading(true);

    const q = query(collection(db, "prescriptions"), where("status", "==", "received"));
    const snapshot = await getDocs(q);
    let allPrescriptions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let allMedications = [];
    let doctorColorsMap = {};
    let prescriptionColorsMap = {};

    let minDate = Infinity;
    let maxDate = -Infinity;

    for (let prescription of allPrescriptions) {
      const medications = await getMedicationsByPrescription(prescription.id);
      const doctorId = prescription.createdBy;

      if (!doctorColorsMap[doctorId]) {
        const doctorProfile = await getUserProfile(doctorId);
        doctorColorsMap[doctorId] = {
          name: doctorProfile?.firstName + " " + doctorProfile?.lastName,
          color: generateColor(Object.keys(doctorColorsMap).length),
        };
      }

      if (!prescriptionColorsMap[prescription.id]) {
        prescriptionColorsMap[prescription.id] = generateColor(Object.keys(prescriptionColorsMap).length + 5);
      }

      medications.forEach((med, index) => {
        if (!med.startDate || !med.endDate) return; // 🔹 Vérification avant traitement

        const startDate = new Date(med.startDate).getTime();
        const endDate = new Date(med.endDate).getTime();

        if (isNaN(startDate) || isNaN(endDate)) {
          console.warn("Date invalide détectée :", med.startDate, med.endDate);
          return; // Skip si la date est invalide
        }

        const duration = (endDate - startDate) / (1000 * 60 * 60 * 24); // Convertir en jours

        minDate = Math.min(minDate, startDate);
        maxDate = Math.max(maxDate, endDate);

        allMedications.push({
          id: `${prescription.id}-${index}`, // 🔹 Correction des clés uniques
          doctor: doctorColorsMap[doctorId].name,
          doctorColor: doctorColorsMap[doctorId].color,
          prescription: `Prescription #${prescription.id}`,
          prescriptionColor: prescriptionColorsMap[prescription.id],
          medication: med.name,
          start: startDate,
          duration: duration,
          end: endDate
        });
      });
    }

    if (minDate === Infinity || maxDate === -Infinity) {
      console.error("Aucune date valide trouvée !");
      setLoading(false);
      return;
    }

    setChartData(allMedications);
    setDoctorColors(doctorColorsMap);
    setPrescriptionColors(prescriptionColorsMap);
    setTimeDomain([minDate, maxDate]);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">📊 Diagramme de Gantt des Médicaments</h2>

      {/* Légende des médecins */}
      <div className="mb-4 flex flex-wrap gap-4">
        {Object.values(doctorColors).map((doc, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: doc.color }}></div>
            <span>{doc.name}</span>
          </div>
        ))}
      </div>

      {/* Légende des prescriptions */}
      <div className="mb-4 flex flex-wrap gap-4">
        {Object.entries(prescriptionColors).map(([id, color]) => (
          <div key={id} className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
            <span>Prescription #{id}</span>
          </div>
        ))}
      </div>

      {/* Diagramme de Gantt */}
      {loading ? (
        <p className="text-gray-500">Chargement des données...</p>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <ResponsiveContainer width="100%" height={500}>
            <BarChart layout="horizontal" data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[timeDomain[0], timeDomain[1]]}
                tickFormatter={(tick) => new Date(tick).toLocaleDateString()} 
              />
              <YAxis type="category" dataKey="medication" width={200} />
              <Tooltip 
                formatter={(value, name, entry) =>
                  [`${new Date(entry.payload.start).toLocaleDateString()} → ${new Date(entry.payload.end).toLocaleDateString()}`, name]
                }
              />
              {chartData.map((med, index) => (
                <Bar 
                  key={med.id} // ✅ Clé unique
                  dataKey="duration" 
                  stackId={med.prescription} 
                  fill={med.prescriptionColor} 
                  background={{ fill: med.doctorColor, opacity: 0.2 }} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
