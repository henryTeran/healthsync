// src/features/dashboard/ui/PatientDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext";
import { MedicationCard } from "../../medications/ui/MedicationCard";
import { ProfileCard } from "../../profile/ui/ProfileCard";
import { SymptomCard } from "../../symptoms/ui/SymptomCard";
import { getPatientDashboardDataUseCase } from "..";
import { QuickActions } from "./QuickActions";
import { RecentActivity } from "./RecentActivity";
import { StatsCard } from "./StatsCard";
import { 
  Calendar, 
  FileText, 
  Activity,
  Heart,
  Clock,
  TrendingUp
} from "lucide-react";
import { logError } from "../../../shared/lib/logger";


export const PatientDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    activePrescriptions: 0,
    symptomsThisWeek: 0,
    medicationsToday: 0
  });
  const [profile, setProfile] = useState(null);
  const [recentMedications, setRecentMedications] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getPatientDashboardDataUseCase(user.uid);
      setProfile(dashboardData.profile);
      setRecentSymptoms(dashboardData.recentSymptoms);
      setRecentMedications(dashboardData.recentMedications);
      setStats(dashboardData.stats);
      
    } catch (error) {
      logError("Erreur lors de la récupération des données du dashboard", error, {
        feature: "dashboard",
        action: "fetchPatientDashboardData",
        userId: user?.uid,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gradient mb-2">Mon Espace Santé</h1>
          <p className="text-neutral-600">
            Bonjour {profile?.firstName}, suivez votre santé au quotidien
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Prochains RDV"
            value={stats.upcomingAppointments}
            icon={Calendar}
            color="medical"
            subtitle="Rendez-vous confirmés"
            loading={loading}
          />
          <StatsCard
            title="Prescriptions"
            value={stats.activePrescriptions}
            icon={FileText}
            color="health"
            subtitle="Ordonnances actives"
            loading={loading}
          />
          <StatsCard
            title="Symptômes"
            value={stats.symptomsThisWeek}
            icon={Activity}
            color="warning"
            subtitle="Cette semaine"
            loading={loading}
          />
          <StatsCard
            title="Médicaments"
            value={stats.medicationsToday}
            icon={Heart}
            color="info"
            subtitle="À prendre aujourd'hui"
            loading={loading}
          />
        </div>

        {/* Actions rapides */}
        <QuickActions userType="patient" />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profil */}
          <div className="lg:col-span-2">
            {profile && (
              <ProfileCard 
                profile={profile} 
                isOwner={true} 
                userType="patient" 
              />
            )}
          </div>

          {/* Activité récente */}
          <div>
            <RecentActivity userType="patient" />
          </div>
        </div>

        {/* Médicaments et symptômes récents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Médicaments récents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-800">Médicaments Récents</h2>
              <Clock className="h-5 w-5 text-medical-500" />
            </div>
            {recentMedications.length > 0 ? (
              <div className="space-y-3">
                {recentMedications.map(medication => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    compact={true}
                    showActions={false}
                  />
                ))}
              </div>
            ) : (
              <div className="card-medical p-8 text-center">
                <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">Aucun médicament actif</p>
              </div>
            )}
          </div>

          {/* Symptômes récents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-800">Symptômes Récents</h2>
              <Activity className="h-5 w-5 text-medical-500" />
            </div>
            {recentSymptoms.length > 0 ? (
              <div className="space-y-3">
                {recentSymptoms.map(symptom => (
                  <SymptomCard
                    key={symptom.id}
                    symptom={symptom}
                    compact={true}
                    showActions={false}
                  />
                ))}
              </div>
            ) : (
              <div className="card-medical p-8 text-center">
                <Activity className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">Aucun symptôme enregistré</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};