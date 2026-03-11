// src/features/dashboard/ui/DoctorDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { FollowRequestsTable } from "../../profile/ui/doctor/FollowRequestsTable";
import { AuthContext } from "../../../contexts/AuthContext";
import { getDoctorDashboardDataUseCase } from "..";
import { ProfileCard } from "../../profile/ui/ProfileCard";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { StatsCard } from "./StatsCard";
import { 
  Users, 
  Calendar, 
  FileText, 
  Activity,
  TrendingUp,
  Clock
} from "lucide-react";

export const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingPrescriptions: 0,
    weeklyConsultations: 0
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getDoctorDashboardDataUseCase(user.uid);
      setProfile(dashboardData.profile);
      setStats(dashboardData.stats);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des données du dashboard :", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient mb-2">Tableau de Bord Médecin</h1>
          <p className="text-neutral-600">
            Bienvenue Dr. {profile?.firstName} {profile?.lastName}
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Patients Suivis"
            value={stats.totalPatients}
            icon={Users}
            color="medical"
            subtitle="Patients autorisés"
            loading={loading}
          />
          <StatsCard
            title="RDV Aujourd'hui"
            value={stats.todayAppointments}
            icon={Calendar}
            color="health"
            subtitle="Consultations prévues"
            loading={loading}
          />
          <StatsCard
            title="Prescriptions"
            value={stats.pendingPrescriptions}
            icon={FileText}
            color="warning"
            subtitle="En attente de validation"
            loading={loading}
          />
          <StatsCard
            title="Cette Semaine"
            value={stats.weeklyConsultations}
            icon={TrendingUp}
            color="info"
            subtitle="Consultations réalisées"
            loading={loading}
          />
        </div>

        {/* Actions rapides */}
        <QuickActions userType="doctor" />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profil */}
          <div className="lg:col-span-2">
            {profile && (
              <ProfileCard 
                profile={profile} 
                isOwner={true} 
                userType="doctor" 
              />
            )}
          </div>

          {/* Activité récente */}
          <div>
            <RecentActivity userType="doctor" />
          </div>
        </div>

        {/* Demandes de suivi */}
        <div className="card-medical p-6">
          <FollowRequestsTable />
        </div>
      </div>
    </div>
  );
};