// src/pages/Dashboard/DoctorDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { StatsCard } from "../../components/StatsCard";
import { ChartWidget } from "../../components/ChartWidget";
import { FollowRequestsTable } from "../Profile/Doctor/FollowRequestsTable";
import PropTypes from "prop-types";
import { getAppointmentsByUser } from "../../services/appointmentService"; // Service pour récupérer les données
import { AuthContext } from "../../contexts/AuthContext";

import { DoctorProfile } from "../Profile/Doctor/DoctorProfile";

export const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [appointmentsData, setAppointmentsData] = useState([]); // État pour les données des rendez-vous
  const [chartType, setChartType] = useState("line"); // Type de graphique (par défaut "line")
  
  

  useEffect(() => {
    fetchAppointmentsData();
   }, []);

  // Récupération des données des rendez-vous
  const fetchAppointmentsData = async () => {
    try {
      if (!user) {
        return;
      }
      const appointments = await getAppointmentsByUser(user.uid, "doctor"); // Remplacez "doctorId" par l'ID réel du médecin
      const data = appointments.map((appointment) => ({
        label: appointment.date.slice(0, 10), // Afficher uniquement la date (YYYY-MM-DD)
        value: appointment.status === "accepté" ? 1 : 0, // 1 pour rendez-vous accepté, 0 sinon
        type: "consultation",
      }));
      setAppointmentsData(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données des rendez-vous :", error);
    }
  };

  return (
    <div className="p-8">
      {/* Header avec Notifications */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de Bord Médecin</h1>
      </div>

      {/* Section Statistiques */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatsCard title="Patients Actifs" value="120" color="success" />
        <StatsCard title="Rendez-vous Planifiés" value="30" color="primary" />
        <StatsCard title="Notifications Non Lues" value="5" color="warning" />
      </div>

      {/* Graphique Évolution Consultations */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Évolution des Consultations</h2>
        <div className="flex space-x-4 mb-4">
          {/* Sélection du type de graphique */}
          <button
            onClick={() => setChartType("line")}
            className={`px-4 py-2 rounded-md ${chartType === "line" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Ligne
          </button>
          <button
            onClick={() => setChartType("pie")}
            className={`px-4 py-2 rounded-md ${chartType === "pie" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Camembert
          </button>
        </div>
        <ChartWidget type={chartType} data={appointmentsData} />
      </div>

      {/* Profil Médecin */}
      <DoctorProfile />

      {/* Tableau des Demandes de Suivi */}
      <FollowRequestsTable />
    </div>
  );
};