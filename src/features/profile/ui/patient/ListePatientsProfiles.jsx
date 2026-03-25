import React, { useState, useEffect, useContext } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../../contexts/AuthContext";
import { followPatientAsDoctor, getAllPatients, getAuthorizedPatients } from "../..";
import { logError } from "../../../../shared/lib/logger";

const PAGE_SIZE = 6;
const DEFAULT_AVATAR = "/default-avatar.png";

export const ListePatientsProfiles = () => {
  const [patients, setPatients] = useState([]);
  const [followedPatients, setFollowedPatients] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const isDoctor = user?.userType === "doctor";

  // 🔥 Écoute en temps réel les patients de la collection "users"
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientList = await getAllPatients();
        setPatients(
          patientList.map((patient) => ({
            ...patient,
            fullName: `${patient.firstName} ${patient.lastName}`,
          }))
        );
      } catch (error) {
        logError("Erreur lors du chargement des patients", error, {
          feature: "profile",
          action: "fetchPatients",
          userId: user?.uid,
        });
      }
    };

    fetchPatients();
  }, []);

  // 🔥 Écoute en temps réel les patients suivis par le médecin
  useEffect(() => {
    if (!user || !isDoctor) return;

    const fetchFollowedPatients = async () => {
      try {
        const followed = await getAuthorizedPatients(user.uid);
        setFollowedPatients(followed.map((patient) => patient.id));
      } catch (error) {
        logError("Erreur lors du chargement des patients suivis", error, {
          feature: "profile",
          action: "fetchFollowedPatients",
          userId: user?.uid,
        });
      }
    };

    fetchFollowedPatients();
  }, [user, isDoctor]);

  const handleFollowPatient = async (patientId) => {
    if (!user || !isDoctor) return;

    try {
      await followPatientAsDoctor(patientId, user);
      setFollowedPatients((previous) => [...new Set([...previous, patientId])]);
    } catch (error) {
      logError("Erreur lors du suivi patient", error, {
        feature: "profile",
        action: "handleFollowPatient",
        userId: user?.uid,
        patientId,
      });
      alert("❌ Impossible de suivre le patient.");
    }
  };

  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.ceil(patients.length / PAGE_SIZE);
  const page = patients.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-8">

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Liste des Patients</h1>
          <p className="text-sm text-neutral-500 mt-1">Consultez et suivez les patients enregistrés sur la plateforme.</p>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm shrink-0">
          <p className="text-xs text-neutral-500">Patients enregistrés</p>
          <p className="text-2xl font-semibold text-neutral-900">{patients.length}</p>
        </div>
      </header>

      {patients.length === 0 ? (
        <section className="rounded-[20px] border border-neutral-100 bg-white p-8 shadow-sm text-center">
          <p className="text-base font-medium text-neutral-800">Aucun patient trouvé.</p>
          <p className="text-sm text-neutral-500 mt-1">La liste sera affichée dès qu&apos;un profil patient est disponible.</p>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
            {page.map((patient) => {
              const patientId = patient.id;
              const isAlreadyFollowed = followedPatients.includes(patientId);
              const fullName = patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient";
              const city = [patient.state, patient.country].filter(Boolean).join(", ") || "Non renseigné";
              const signupDate = patient.signupDate ? new Date(patient.signupDate).toLocaleDateString("fr-FR") : "—";
              const avatar = patient.photoURL || DEFAULT_AVATAR;

              return (
                <article key={patientId} className="rounded-[20px] bg-white border border-neutral-100 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition">
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
                        <p className="text-sm text-neutral-500">Patient HealthSync</p>
                      </div>
                    </div>
                    {isDoctor && isAlreadyFollowed ? (
                      <span className="inline-flex items-center rounded-full bg-health-100 px-3 py-1 text-xs font-semibold text-health-700">
                        Suivi
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                        Actif
                      </span>
                    )}
                  </div>

                  <div className="h-px bg-neutral-100 mb-4" />

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Mail className="h-4 w-4 text-health-600 shrink-0" />
                      <span className="truncate">{patient.email || "Non renseigné"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Phone className="h-4 w-4 text-health-600 shrink-0" />
                      <span>{patient.mobileNumber || "Non renseigné"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <MapPin className="h-4 w-4 text-health-600 shrink-0" />
                      <span>{city}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                      Inscrit le {signupDate}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {patientId ? (
                      <button
                        onClick={() => navigate(`/patientprofile/${patientId}`)}
                        className="inline-flex items-center rounded-xl bg-medical-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-medical-700 active:scale-95"
                      >
                        Voir profil
                      </button>
                    ) : (
                      <span className="text-neutral-500 text-xs">ID introuvable</span>
                    )}
                    {isDoctor && !isAlreadyFollowed && (
                      <button
                        onClick={() => handleFollowPatient(patientId)}
                        className="inline-flex items-center rounded-xl border border-health-200 bg-health-50 px-4 py-2 text-sm font-medium text-health-700 transition hover:bg-health-100 active:scale-95"
                      >
                        Suivre patient
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPageIndex((p) => p - 1)}
                disabled={!canPreviousPage}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm font-medium text-neutral-600">Page {pageIndex + 1} / {pageCount}</span>
              <button
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={!canNextPage}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};


