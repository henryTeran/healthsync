import { useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { Check, Clock3, History, X } from "lucide-react";
import { AuthContext } from "../../../../contexts/AuthContext";
import {
  getAppointmentsByUser,
  sendAppointmentConfirmation,
  updateAppointment,
} from "../../../appointments";
import { logError } from "../../../../shared/lib/logger";

const getStatusClasses = (status) => {
  if (status === "accepté") {
    return "bg-health-100 text-health-700";
  }
  if (status === "refusé") {
    return "bg-red-100 text-red-700";
  }
  return "bg-yellow-100 text-yellow-700 animate-pulse";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
};

export const AppointmentRequestsTable = ({ mode = "requests", onDataLoaded }) => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams();

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const doctorId = paramDoctorId || user?.uid;
  const isOwner = user?.uid === doctorId;

  useEffect(() => {
    if (!doctorId) {
      setError("ID du médecin introuvable.");
      setIsLoading(false);
      onDataLoaded?.([]);
      return;
    }

    const fetchAppointments = async () => {
      try {
        const appointmentDocs = await getAppointmentsByUser(doctorId, "doctor");
        setAppointments(appointmentDocs);
        onDataLoaded?.(appointmentDocs);
        setIsLoading(false);
      } catch (fetchError) {
        setError(fetchError.message || "Impossible de charger les rendez-vous.");
        onDataLoaded?.([]);
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [doctorId, onDataLoaded]);

  const handleAccept = async (appointmentId, patientId) => {
    try {
      await updateAppointment(appointmentId, { status: "accepté" });
      await sendAppointmentConfirmation(appointmentId, "accepté", user.uid, patientId);
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: "accepté" } : appointment
        )
      );
    } catch (saveError) {
      logError("Erreur lors de l'acceptation du rendez-vous", saveError, {
        feature: "profile",
        action: "handleAccept",
        appointmentId,
        patientId,
      });
    }
  };

  const handleReject = async (appointmentId, patientId) => {
    try {
      await updateAppointment(appointmentId, { status: "refusé" });
      await sendAppointmentConfirmation(appointmentId, "refusé", user.uid, patientId);
      setAppointments((previous) =>
        previous.map((appointment) =>
          appointment.id === appointmentId ? { ...appointment, status: "refusé" } : appointment
        )
      );
    } catch (saveError) {
      logError("Erreur lors du refus du rendez-vous", saveError, {
        feature: "profile",
        action: "handleReject",
        appointmentId,
        patientId,
      });
    }
  };

  const visibleRows = useMemo(() => {
    if (mode === "history") {
      return appointments.filter((item) => item.status === "accepté" || item.status === "refusé");
    }

    return appointments;
  }, [appointments, mode]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-10 rounded-lg bg-neutral-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!visibleRows.length) {
    return (
      <div className="text-center py-10">
        <History className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">Aucune donnée à afficher.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-neutral-100 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto max-h-[430px]">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50">
            <tr className="text-left text-neutral-600">
              <th className="px-4 py-3 font-semibold">Patient</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Heure</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              {mode === "requests" && isOwner && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((request, index) => (
              <tr
                key={request.id}
                className={`transition-colors hover:bg-medical-50 ${index % 2 === 0 ? "bg-white" : "bg-neutral-50/40"}`}
              >
                <td className="px-4 py-3 text-neutral-800 font-medium">{request.patientName || "Patient"}</td>
                <td className="px-4 py-3 text-neutral-700">{formatDate(request.date)}</td>
                <td className="px-4 py-3 text-neutral-700">{request.time || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClasses(request.status)}`}>
                    {request.status === "en attente" && <Clock3 className="h-3 w-3" />}
                    {request.status || "en attente"}
                  </span>
                </td>

                {mode === "requests" && isOwner && (
                  <td className="px-4 py-3 text-right">
                    {request.status === "en attente" ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(request.id, request.patientId)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-health-100 text-health-700 hover:bg-health-200 active:scale-95 transition"
                          aria-label="Accepter"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.patientId)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 active:scale-95 transition"
                          aria-label="Refuser"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">Traitée</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AppointmentRequestsTable.propTypes = {
  mode: PropTypes.oneOf(["requests", "history"]),
  onDataLoaded: PropTypes.func,
};
