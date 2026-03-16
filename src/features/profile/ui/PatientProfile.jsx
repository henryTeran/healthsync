import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  HeartPulse,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserCircle2,
  Users,
} from "lucide-react";

import { AuthContext } from "../../../contexts/AuthContext";
import { getAuthorizedDoctors, getUserProfile } from "..";
import { getAppointmentsByUser } from "../../appointments";
import { logDebug, logError, logWarn } from "../../../shared/lib/logger";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";

const tabs = [
  { id: "doctors", label: "Médecins autorisés" },
  { id: "appointments", label: "Rendez-vous" },
  { id: "history", label: "Historique RDV" },
];

const formatDate = (value) => {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const getStatusClasses = (status) => {
  if (status === "accepté") return "bg-health-100 text-health-700";
  if (status === "refusé") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

export const PatientProfile = () => {
  const { user } = useContext(AuthContext);
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  const patientId = paramUserId || user?.uid;
  const isOwner = user?.uid === patientId;

  const [activeTab, setActiveTab] = useState("doctors");
  const [patientProfile, setPatientProfile] = useState(null);
  const [authorizedDoctors, setAuthorizedDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) {
      setError("Utilisateur non connecté.");
      setIsLoading(false);
      logWarn("PatientProfile: patientId manquant", {
        code: ERROR_CODES.PROFILE.LOAD_FAILED,
        feature: "profile",
        action: "PatientProfile.resolvePatientId",
        currentUserId: user?.uid,
      });
      return;
    }

    const loadPatientProfile = async () => {
      try {
        const profilePromise = getUserProfile(patientId);
        const doctorsPromise = isOwner ? getAuthorizedDoctors(patientId) : Promise.resolve([]);
        const appointmentsPromise = isOwner
          ? getAppointmentsByUser(patientId, "patient")
          : Promise.resolve([]);

        const [profileData, doctors, appointmentData] = await Promise.all([
          profilePromise,
          doctorsPromise,
          appointmentsPromise,
        ]);

        const normalizedProfile = {
          ...profileData,
          userType: profileData?.userType || profileData?.type || "patient",
          type: profileData?.type || "patient",
        };

        setPatientProfile(normalizedProfile);
        setAuthorizedDoctors(doctors || []);
        setAppointments(appointmentData || []);
        setError("");

        logDebug("PatientProfile loaded", {
          feature: "profile",
          action: "PatientProfile.load",
          patientId,
          doctors: doctors?.length || 0,
          appointments: appointmentData?.length || 0,
          isOwner,
        });
      } catch (loadError) {
        setError(loadError.message || "Impossible de charger le profil patient.");
        logError("Échec chargement profil patient", loadError, {
          code: ERROR_CODES.PROFILE.LOAD_FAILED,
          feature: "profile",
          action: "PatientProfile.load",
          patientId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientProfile();
  }, [isOwner, patientId, user?.uid]);

  const todayAppointmentsCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter((item) => item.date === today).length;
  }, [appointments]);

  const acceptedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "accepté").length,
    [appointments]
  );

  const careAdherence = useMemo(() => {
    if (!appointments.length) return 95;
    return Math.max(80, Math.min(99, Math.round((acceptedAppointments / appointments.length) * 100)));
  }, [acceptedAppointments, appointments.length]);

  const visibleAppointments = useMemo(() => {
    if (activeTab === "history") {
      return appointments.filter((item) => item.status === "accepté" || item.status === "refusé");
    }
    return appointments;
  }, [activeTab, appointments]);

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
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Profil Patient</h1>
        <p className="text-sm text-neutral-500">Consultation des informations patient et de son suivi médical.</p>
      </header>

      <section className="rounded-[20px] border border-white/60 bg-white/90 backdrop-blur-sm shadow-medical p-6 lg:p-8">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-5 md:items-center">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md">
              <img
                src={patientProfile?.photoURL || "/default-avatar.png"}
                alt="Patient avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
                {patientProfile?.firstName} {patientProfile?.lastName}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-health-100 text-health-700">
                  Actif
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-medical-100 text-medical-700 inline-flex items-center gap-1">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Patient HealthSync
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {authorizedDoctors.length} médecin(s)
                </span>
              </div>
              <p className="text-sm text-neutral-500">
                Allergies: <span className="font-medium text-neutral-700">{patientProfile?.allergies || "Aucune renseignée"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:min-w-[480px]">
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Médecins autorisés</p>
              <p className="text-2xl font-semibold text-neutral-900">{authorizedDoctors.length}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Rendez-vous aujourd&apos;hui</p>
              <p className="text-2xl font-semibold text-neutral-900">{todayAppointmentsCount}</p>
            </div>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Adhérence suivi</p>
              <p className="text-2xl font-semibold text-neutral-900">{careAdherence}%</p>
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
            <p className="font-medium text-neutral-800">{patientProfile?.firstName} {patientProfile?.lastName}</p>
            <p className="text-neutral-500">Date de naissance</p>
            <p className="font-medium text-neutral-800">{formatDate(patientProfile?.dateOfBirth)}</p>
            <p className="text-neutral-500">Âge</p>
            <p className="font-medium text-neutral-800">{patientProfile?.age || "—"}</p>
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
            <p className="font-medium text-neutral-800 break-all">{patientProfile?.email || "—"}</p>
            <p className="text-neutral-500">Téléphone</p>
            <p className="font-medium text-neutral-800">{patientProfile?.mobileNumber || "—"}</p>
          </div>
        </article>

        <article className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-medical-600" />
            <h3 className="text-base font-semibold text-neutral-900">Adresse</h3>
          </div>
          <div className="h-px bg-neutral-100 mb-3" />
          <div className="space-y-2 text-sm">
            <p className="text-neutral-500">Rue</p>
            <p className="font-medium text-neutral-800">{patientProfile?.address || "—"}</p>
            <p className="text-neutral-500">Ville / Code postal</p>
            <p className="font-medium text-neutral-800">{patientProfile?.postalCode || ""} {patientProfile?.state || "—"}</p>
            <p className="text-neutral-500">Pays</p>
            <p className="font-medium text-neutral-800">{patientProfile?.country || "—"}</p>
          </div>
        </article>

        <article className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-medical-600" />
            <h3 className="text-base font-semibold text-neutral-900">Informations médicales</h3>
          </div>
          <div className="h-px bg-neutral-100 mb-3" />
          <div className="space-y-2 text-sm">
            <p className="text-neutral-500">Allergies</p>
            <p className="font-medium text-neutral-800">{patientProfile?.allergies || "Aucune"}</p>
            <p className="text-neutral-500">Statut</p>
            <p className="font-medium text-neutral-800">{patientProfile?.status || "Actif"}</p>
          </div>
        </article>
      </section>

      <section className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-neutral-900">Suivi lié au profil</h2>
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
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "doctors" && (
          <div className="rounded-[20px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[430px]">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="sticky top-0 z-10 bg-neutral-50">
                  <tr className="text-left text-neutral-600">
                    <th className="px-4 py-3 font-semibold">Médecin</th>
                    <th className="px-4 py-3 font-semibold">Département</th>
                    <th className="px-4 py-3 font-semibold">Fonction</th>
                  </tr>
                </thead>
                <tbody>
                  {authorizedDoctors.length ? (
                    authorizedDoctors.map((doctor, index) => (
                      <tr
                        key={doctor.id}
                        className={`transition-colors hover:bg-medical-50 ${index % 2 === 0 ? "bg-white" : "bg-neutral-50/40"}`}
                      >
                        <td className="px-4 py-3 text-neutral-800 font-medium inline-flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-medical-500" />
                          Dr. {doctor.firstName} {doctor.lastName}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{doctor.department || "—"}</td>
                        <td className="px-4 py-3 text-neutral-700">{doctor.designation || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                        Aucun médecin autorisé pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "appointments" || activeTab === "history") && (
          <div className="rounded-[20px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[430px]">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="sticky top-0 z-10 bg-neutral-50">
                  <tr className="text-left text-neutral-600">
                    <th className="px-4 py-3 font-semibold">Médecin</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Heure</th>
                    <th className="px-4 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAppointments.length ? (
                    visibleAppointments.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`transition-colors hover:bg-medical-50 ${index % 2 === 0 ? "bg-white" : "bg-neutral-50/40"}`}
                      >
                        <td className="px-4 py-3 text-neutral-800 font-medium">{item.doctorName || "Médecin"}</td>
                        <td className="px-4 py-3 text-neutral-700">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 text-neutral-700">{item.time || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClasses(item.status)}`}>
                            {item.status || "en attente"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                        Aucune donnée à afficher.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {!isOwner && (
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="text-sm text-neutral-600 inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-medical-500" />
            Vue consultation: certaines données de suivi sont réservées au patient propriétaire.
          </p>
        </section>
      )}
    </div>
  );
};
