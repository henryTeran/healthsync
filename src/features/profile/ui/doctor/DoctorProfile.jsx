import { lazy, Suspense, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCircle2,
  Users,
} from "lucide-react";

import { AuthContext } from "../../../../contexts/AuthContext";
import { getUserProfile, getAuthorizedPatients } from "../..";
import { getAppointmentsByUser } from "../../../appointments";
import { listenRecentActivityUseCase } from "../../../dashboard";
import { logDebug, logError, logWarn } from "../../../../shared/lib/logger";
import { ERROR_CODES } from "../../../../shared/lib/errorCodes";

const FollowedTable = lazy(() => import("./FollowedTable").then((module) => ({ default: module.FollowedTable })));
const AppointmentRequestsTable = lazy(() =>
  import("./AppointmentsRequestTabe").then((module) => ({ default: module.AppointmentRequestsTable }))
);

const tabs = [
  { id: "patients", label: "Patients suivis" },
  { id: "requests", label: "Demandes RDV" },
  { id: "history", label: "Historique consultations" },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "à l'instant";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "à l'instant";

  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return "à l'instant";
  if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `il y a ${Math.floor(diffInMinutes / 60)} h`;
  return `il y a ${Math.floor(diffInMinutes / 1440)} j`;
};

export const DoctorProfile = () => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("patients");
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patientsCount, setPatientsCount] = useState(0);
  const [appointmentsCountToday, setAppointmentsCountToday] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [timelineActivities, setTimelineActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const doctorId = paramDoctorId || user?.uid;
  const isOwner = user?.uid === doctorId;

  useEffect(() => {
    if (!doctorId) {
      setError("Aucun médecin trouvé.");
      setIsLoading(false);
      logWarn("DoctorProfile: doctorId manquant", {
        code: ERROR_CODES.PROFILE.LOAD_FAILED,
        feature: "profile",
        action: "DoctorProfile.resolveDoctorId",
        currentUserId: user?.uid,
      });
      return;
    }

    let unsubscribeActivity = () => {};

    const loadDoctorDashboard = async () => {
      try {
        const [profileData, patients, appointments] = await Promise.all([
          getUserProfile(doctorId),
          getAuthorizedPatients(doctorId),
          getAppointmentsByUser(doctorId, "doctor"),
        ]);

        const today = new Date().toISOString().split("T")[0];
        const todayAppointments = appointments.filter((appointment) => appointment.date === today);
        const pending = appointments.filter((appointment) => appointment.status === "en attente").length;
        const accepted = appointments.filter((appointment) => appointment.status === "accepté").length;

        const normalizedProfile = {
          ...profileData,
          userType: profileData?.userType || profileData?.type || "doctor",
          type: profileData?.type || "doctor",
        };

        setDoctorProfile(normalizedProfile);
        setPatientsCount(patients.length);
        setAppointmentsCountToday(todayAppointments.length);
        setPendingRequestsCount(pending);
        setAcceptedCount(accepted);
        setError("");

        unsubscribeActivity = listenRecentActivityUseCase(doctorId, (activities) => {
          setTimelineActivities((activities || []).slice(0, 4));
        });

        logDebug("DoctorProfile dashboard loaded", {
          feature: "profile",
          action: "DoctorProfile.load",
          doctorId,
          patients: patients.length,
          appointmentsToday: todayAppointments.length,
          pending,
        });
      } catch (loadError) {
        setError(loadError.message || "Impossible de charger le profil médecin.");
        logError("Échec chargement dashboard médecin", loadError, {
          code: ERROR_CODES.PROFILE.LOAD_FAILED,
          feature: "profile",
          action: "DoctorProfile.load",
          doctorId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctorDashboard();

    return () => {
      unsubscribeActivity();
    };
  }, [doctorId, user?.uid]);

  const satisfactionRate = useMemo(() => {
    const totalHandled = acceptedCount + pendingRequestsCount;
    if (!totalHandled) return 96;
    return Math.max(85, Math.min(99, Math.round((acceptedCount / totalHandled) * 100)));
  }, [acceptedCount, pendingRequestsCount]);

  const miniChartValues = useMemo(
    () => [Math.min(100, patientsCount * 4), Math.min(100, appointmentsCountToday * 20), satisfactionRate],
    [patientsCount, appointmentsCountToday, satisfactionRate]
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-neutral-50 min-h-screen">
        <div className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-8 animate-pulse">
          <div className="h-9 w-72 bg-neutral-200 rounded mb-6" />
          <div className="h-4 w-full bg-neutral-100 rounded mb-3" />
          <div className="h-4 w-2/3 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-neutral-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Doctor Profile Dashboard</h1>
          <p className="text-sm text-neutral-500">Vue premium HealthSync pour le suivi clinique quotidien.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 shadow-sm text-sm text-neutral-600">
          <Bell className="h-4 w-4 text-medical-500" />
          <span>Notifications</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-[20px] border border-white/60 bg-white/90 backdrop-blur-sm shadow-medical p-6 lg:p-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md">
              <img
                src={doctorProfile?.photoURL || "/default-avatar.png"}
                alt="Doctor avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                Dr. {doctorProfile?.firstName} {doctorProfile?.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-health-100 text-health-700">
                  Actif
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-medical-100 text-medical-700 inline-flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {doctorProfile?.specialty || "Médecine générale"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {doctorProfile?.department || "Département clinique"}
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                Fonction: <span className="font-medium text-neutral-700">{doctorProfile?.designation || "Médecin chef"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:min-w-[480px]">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Patients suivis</p>
              <p className="text-2xl font-semibold text-neutral-900">{patientsCount}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Rendez-vous aujourd'hui</p>
              <p className="text-2xl font-semibold text-neutral-900">{appointmentsCountToday}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Taux de satisfaction</p>
              <p className="text-2xl font-semibold text-neutral-900">{satisfactionRate}%</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isOwner && (
            <button
              onClick={() => navigate("/editprofile")}
              className="px-4 py-2 rounded-xl bg-medical-600 text-white hover:bg-medical-700 active:scale-95 transition"
            >
              Modifier profil
            </button>
          )}
          <button
            onClick={() => navigate("/chat")}
            className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 active:scale-95 transition inline-flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Envoyer message
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          {miniChartValues.map((value, index) => (
            <div key={index} className="rounded-xl bg-neutral-50 p-3">
              <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-medical-500 to-health-500 transition-all duration-500" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <UserCircle2 className="h-4 w-4 text-medical-600" />
            <h3 className="text-base font-semibold text-neutral-900">Informations personnelles</h3>
          </div>
          <div className="h-px bg-neutral-100 mb-3" />
          <div className="space-y-2 text-sm">
            <p className="text-neutral-500">Nom</p>
            <p className="font-medium text-neutral-800">Dr. {doctorProfile?.firstName} {doctorProfile?.lastName}</p>
            <p className="text-neutral-500">Date de naissance</p>
            <p className="font-medium text-neutral-800">{formatDate(doctorProfile?.dateOfBirth)}</p>
          </div>
        </article>

        <article className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-medical-600" />
            <h3 className="text-base font-semibold text-neutral-900">Contact</h3>
          </div>
          <div className="h-px bg-neutral-100 mb-3" />
          <div className="space-y-2 text-sm">
            <p className="text-neutral-500 inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email</p>
            <p className="font-medium text-neutral-800 break-all">{doctorProfile?.email || "—"}</p>
            <p className="text-neutral-500">Téléphone</p>
            <p className="font-medium text-neutral-800">{doctorProfile?.mobileNumber || "—"}</p>
          </div>
        </article>

        <article className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-medical-600" />
            <h3 className="text-base font-semibold text-neutral-900">Licence & formation</h3>
          </div>
          <div className="h-px bg-neutral-100 mb-3" />
          <div className="space-y-2 text-sm">
            <p className="text-neutral-500">Licence médicale</p>
            <p className="font-medium text-neutral-800">{doctorProfile?.medicalLicense || "—"}</p>
            <p className="text-neutral-500">Formation</p>
            <p className="font-medium text-neutral-800">{doctorProfile?.education || "—"}</p>
          </div>
        </article>

        <article className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-medical-600" />
            <h3 className="text-base font-semibold text-neutral-900">Bio / À propos</h3>
          </div>
          <div className="h-px bg-neutral-100 mb-3" />
          <p className="text-sm text-neutral-700 leading-relaxed min-h-[88px]">
            {doctorProfile?.about || "Aucune biographie renseignée pour le moment."}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-[20px] bg-white border border-neutral-100 shadow-sm p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-neutral-900">Patients & rendez-vous</h2>
            <div className="inline-flex rounded-xl bg-neutral-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-white text-medical-700 shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {tab.label}
                    {tab.id === "requests" && pendingRequestsCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[10px] bg-yellow-200 text-yellow-800 animate-pulse">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="transition-all duration-300">
            {activeTab === "patients" && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Chargement des patients...</p>}>
                <FollowedTable onDataLoaded={(items) => setPatientsCount(items.length)} />
              </Suspense>
            )}

            {activeTab === "requests" && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Chargement des demandes...</p>}>
                <AppointmentRequestsTable
                  mode="requests"
                  onDataLoaded={(items) => {
                    const pending = (items || []).filter((item) => item.status === "en attente").length;
                    const accepted = (items || []).filter((item) => item.status === "accepté").length;
                    setPendingRequestsCount(pending);
                    setAcceptedCount(accepted);
                  }}
                />
              </Suspense>
            )}

            {activeTab === "history" && (
              <Suspense fallback={<p className="text-sm text-neutral-500">Chargement de l'historique...</p>}>
                <AppointmentRequestsTable mode="history" />
              </Suspense>
            )}
          </div>
        </div>

        <aside className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Timeline d'activité</h3>
            <Activity className="h-4 w-4 text-medical-500" />
          </div>

          <div className="space-y-4">
            {timelineActivities.length ? (
              timelineActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-medical-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800">{activity.title || "Activité"}</p>
                    <p className="text-xs text-neutral-500">{activity.description || "Mise à jour enregistrée"}</p>
                    <p className="text-[11px] text-neutral-400 mt-1 inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">Aucune activité récente à afficher.</p>
            )}
          </div>

          <div className="mt-6 rounded-xl bg-neutral-50 p-4 border border-neutral-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">Indicateur consultation hebdo</p>
              <CalendarDays className="h-4 w-4 text-medical-500" />
            </div>
            <p className="text-xl font-semibold text-neutral-900 mt-2">{acceptedCount}</p>
            <p className="text-xs text-neutral-500">consultations validées</p>
          </div>
        </aside>
      </section>

      <div className="hidden md:flex items-center justify-end gap-2 text-xs text-neutral-400">
        <Users className="h-3.5 w-3.5" />
        <span>Interface optimisée pour desktop, tablette et mobile</span>
      </div>
    </div>
  );
};
