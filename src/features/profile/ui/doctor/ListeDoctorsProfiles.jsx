import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Phone, ShieldCheck } from "lucide-react";
import { getAllDoctors, requestFollow } from "../..";
import { AuthContext } from "../../../../contexts/AuthContext";
import { logError } from "../../../../shared/lib/logger";

const DEFAULT_AVATAR = "/default-avatar.png";

export const ListeDoctorsProfiles = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await getAllDoctors();
        setDoctors(doctorsData);
      } catch (error) {
        logError("Erreur lors du chargement des médecins", error, {
          feature: "profile",
          action: "fetchDoctors",
          userId: user?.uid,
        });
      }
    };

    fetchDoctors();
  }, []);

  const handleFollowRequest = async (doctorId) => {
    try {
      if (!user) throw new Error("Utilisateur non authentifié.");
      await requestFollow(user.uid, doctorId);
      alert("Demande de suivi envoyée !");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Liste des médecins</h1>
          <p className="text-sm text-neutral-500 mt-1">Sélectionnez un praticien pour consulter son profil et démarrer votre suivi.</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm shrink-0">
          <p className="text-xs text-neutral-500">Médecins disponibles</p>
          <p className="text-2xl font-semibold text-neutral-900">{doctors.length}</p>
        </div>
      </header>

        {doctors.length === 0 ? (
          <section className="rounded-[20px] border border-neutral-100 bg-white p-8 shadow-sm text-center">
            <p className="text-base font-medium text-neutral-800">Aucun médecin trouvé.</p>
            <p className="text-sm text-neutral-500 mt-1">La liste sera affichée dès qu&apos;un profil médecin est disponible.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {doctors.map((doctor) => {
              const fullName = `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || "Médecin";
              const specialization = doctor.department || "Médecine générale";
              const phone = doctor.mobileNumber || "Non spécifié";
              const avatar = doctor.photoURL || DEFAULT_AVATAR;

              return (
                <article key={doctor.id} className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-100">
                        <img
                          src={avatar}
                          alt={`Avatar ${fullName}`}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = DEFAULT_AVATAR;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900">{fullName}</h3>
                        <p className="text-sm text-neutral-500">Praticien HealthSync</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-health-100 px-3 py-1 text-xs font-semibold text-health-700">
                      Actif
                    </span>
                  </div>

                  <div className="h-px bg-neutral-100 mb-4" />

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Building2 className="h-4 w-4 text-medical-600" />
                      <span>{specialization}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Phone className="h-4 w-4 text-medical-600" />
                      <span>{phone}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {specialization}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate(`/doctorprofile/${doctor.id}`)}
                      className="inline-flex items-center rounded-xl bg-medical-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-medical-700 active:scale-95"
                    >
                      Voir profil
                    </button>
                    {user?.userType === "patient" && (
                      <button
                        onClick={() => handleFollowRequest(doctor.id)}
                        className="inline-flex items-center rounded-xl border border-health-200 bg-health-50 px-4 py-2 text-sm font-medium text-health-700 transition hover:bg-health-100 active:scale-95"
                      >
                        Demander suivi
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
    </div>
  );
};
