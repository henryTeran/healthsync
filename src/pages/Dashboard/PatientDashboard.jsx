// src/pages/Dashboard/PatientDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { StatsCard } from "../../components/dashboard/StatsCard";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { RecentActivity } from "../../components/dashboard/RecentActivity";
import { ProfileCard } from "../../components/profile/ProfileCard";
import { MedicationCard } from "../../components/medications/MedicationCard";
import { SymptomCard } from "../../components/symptoms/SymptomCard";
import { AuthContext } from "../../contexts/AuthContext";
import { getUserProfile } from "../../services/profileService";
import { getAppointmentsByUser } from "../../services/appointmentService";
import { getPrescriptionsByPatient } from "../../services/prescriptionService";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { 
  Calendar, 
  FileText, 
  Activity,
  Heart,
  Clock,
  TrendingUp
} from "lucide-react";


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
      
      // Récupérer le profil
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData);
      
      // Récupérer les données en parallèle
      const [appointments, prescriptions] = await Promise.all([
        getAppointmentsByUser(user.uid, "patient"),
        getPrescriptionsByPatient(user.uid)
      ]);
      
      // Récupérer les symptômes récents
      const symptomsQuery = query(
        collection(db, "symptoms"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        limit(3)
      );
      const symptomsSnapshot = await getDocs(symptomsQuery);
      const symptoms = symptomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentSymptoms(symptoms);
      
      // Récupérer les médicaments actifs
      const medicationsQuery = query(
        collection(db, "userMedications"),
        where("userId", "==", user.uid),
        where("status", "==", "active"),
        limit(3)
      );
      const medicationsSnapshot = await getDocs(medicationsQuery);
      const medications = medicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentMedications(medications);
      
      // Calculer les statistiques
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      
      const upcomingAppointments = appointments.filter(apt => 
        new Date(apt.date) >= new Date(today) && apt.status === 'accepté'
      ).length;
      
      const activePrescriptions = prescriptions.filter(presc => 
        presc.status === 'received' || presc.status === 'validated'
      ).length;
      
      const symptomsThisWeek = symptoms.filter(symptom => 
        new Date(symptom.date) >= weekStart
      ).length;
      
      const medicationsToday = medications.filter(med => {
        if (!med.times || !med.startDate || !med.endDate) return false;
        const start = new Date(med.startDate);
        const end = new Date(med.endDate);
        return now >= start && now <= end;
      }).length;
      
      setStats({
        upcomingAppointments,
        activePrescriptions,
        symptomsThisWeek,
        medicationsToday
      });
      
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