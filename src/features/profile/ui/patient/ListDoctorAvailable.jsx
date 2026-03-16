import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { getAllDoctors, getAuthorizedDoctors, requestFollow } from "../..";
import { AuthContext } from "../../../../contexts/AuthContext";
import { logError, logInfo } from "../../../../shared/lib/logger";

export const ListDoctorAvailable = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [authorizedDoctors, setAuthorizedDoctors] = useState([]);
  const [pendingDoctorId, setPendingDoctorId] = useState(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        if (!user?.uid) {
          setError("Utilisateur non authentifié.");
          setIsLoading(false);
          return;
        }

        const [allDoctors, authorized] = await Promise.all([
          getAllDoctors(),
          getAuthorizedDoctors(user.uid),
        ]);

        setDoctors(allDoctors || []);
        setAuthorizedDoctors(authorized || []);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "Impossible de charger les médecins disponibles.");
        logError("Erreur lors du chargement des médecins disponibles", loadError, {
          feature: "profile",
          action: "ListDoctorAvailable.loadDoctors",
          userId: user?.uid,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [user?.uid]);

  const authorizedDoctorIds = useMemo(
    () => new Set((authorizedDoctors || []).map((doctor) => doctor.id)),
    [authorizedDoctors]
  );

  const handleFollowRequest = async (doctorId) => {
    try {
      if (!user?.uid) {
        throw new Error("Utilisateur non authentifié.");
      }

      setPendingDoctorId(doctorId);
      setSuccessMessage("");
      await requestFollow(user.uid, doctorId);
      setAuthorizedDoctors((previous) => {
        const doctor = doctors.find((item) => item.id === doctorId);
        return doctor ? [...previous, doctor] : previous;
      });
      setSuccessMessage("Demande de suivi envoyée avec succès.");
      logInfo("Demande de suivi médecin envoyée", {
        feature: "profile",
        action: "ListDoctorAvailable.handleFollowRequest",
        userId: user.uid,
        doctorId,
      });
    } catch (requestError) {
      setError(requestError.message || "Impossible d'envoyer la demande de suivi.");
      logError("Erreur lors de l'envoi de la demande de suivi", requestError, {
        feature: "profile",
        action: "ListDoctorAvailable.handleFollowRequest",
        userId: user?.uid,
        doctorId,
      });
    } finally {
      setPendingDoctorId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[20px] border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="space-y-3 animate-pulse">
          <div className="h-6 w-56 rounded bg-neutral-200" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-48 rounded-[20px] bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-[20px] border border-neutral-100 bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Médecins disponibles</h2>
          <p className="text-sm text-neutral-500">Recherchez un professionnel de santé compatible avec votre parcours de soin.</p>
        </div>
        <button
          onClick={() => navigate("/notifications")}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 active:scale-95 transition"
        >
          <MessageSquare className="h-4 w-4" />
          Voir les notifications
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {successMessage && <div className="rounded-xl border border-health-200 bg-health-50 px-4 py-3 text-sm text-health-700">{successMessage}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {doctors.length ? (
          doctors.map((doctor) => {
            const isAuthorized = authorizedDoctorIds.has(doctor.id);
            const isPending = pendingDoctorId === doctor.id;

            return (
              <article
                key={doctor.id}
                className="group rounded-[20px] border border-neutral-100 bg-gradient-to-b from-white to-neutral-50 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-medical-100 text-medical-700">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-xs text-neutral-500">{doctor.designation || "Praticien"}</p>
                    </div>
                  </div>

                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isAuthorized ? "bg-health-100 text-health-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {isAuthorized ? "Autorisé" : "Disponible"}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-neutral-600">
                    <Building2 className="h-4 w-4 text-medical-500" />
                    <span>{doctor.department || "Département non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <ShieldCheck className="h-4 w-4 text-medical-500" />
                    <span>{doctor.medicalLicense || "Licence à vérifier"}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    onClick={() => navigate(`/doctorprofile/${doctor.id}`)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-medical-700 hover:text-medical-800"
                  >
                    Consulter le profil
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </button>

                  <button
                    onClick={() => handleFollowRequest(doctor.id)}
                    disabled={isAuthorized || isPending}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-95 ${
                      isAuthorized
                        ? "bg-neutral-100 text-neutral-500 cursor-not-allowed"
                        : "bg-health-600 text-white hover:bg-health-700"
                    } ${isPending ? "opacity-70 cursor-wait" : ""}`}
                  >
                    {isAuthorized ? <CheckCircle2 className="h-4 w-4" /> : null}
                    {isAuthorized ? "Suivi actif" : isPending ? "Envoi..." : "Demander suivi"}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-500">
            Aucun médecin disponible pour le moment.
          </div>
        )}
      </div>
    </section>
  );
};
