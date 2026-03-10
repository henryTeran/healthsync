import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { db } from "../../../providers/firebase";
import { getUserProfile } from "../../../features/profile";
import { updateAppointment } from "../../../features/appointments";
import { addNotification } from "../../../features/notifications";
import { onSnapshot, collection, query, where, doc, getDoc } from "firebase/firestore";

export const AppointmentRequestsTable = () => {
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
      return;
    }

    const fetchAppointments = () => {
      const q = query(collection(db, "appointments"), where("doctorId", "==", doctorId));
      return onSnapshot(q, async (snapshot) => {
        const appointmentDocs = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const patient = await getUserProfile(data.patientId);
            return {
              id: docSnap.id,
              ...data,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Inconnu",
            };
          })
        );
        setAppointments(appointmentDocs);
        setIsLoading(false);
      });
    };

    const unsubscribe = fetchAppointments();
    return () => unsubscribe();
  }, [doctorId]);

  const handleAccept = async (appointmentId, patientId, date, time) => {
    try {
      await updateAppointment(appointmentId, { status: "accepté" });
      
      // Envoyer la confirmation avec rappels automatiques
      await sendAppointmentConfirmation(appointmentId, "accepté", user.uid, patientId);
      
      const doctorData = await getUserProfile(user.uid);
      
      alert("Rendez-vous accepté ! Le patient a été notifié et des rappels ont été programmés.");
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
      alert(error.message);
    }
  };

  const handleReject = async (appointmentId, patientId, date, time) => {
    try {
      await updateAppointment(appointmentId, { status: "refusé" });
      
      // Envoyer la notification de refus
      await sendAppointmentConfirmation(appointmentId, "refusé", user.uid, patientId);
      
      const doctorData = await getUserProfile(user.uid);
      
      alert("Rendez-vous refusé. Le patient a été notifié.");
    } catch (error) {
      console.error("Erreur lors du refus:", error);
      alert(error.message);
    }
  };

  if (isLoading) return <p>Chargement des rendez-vous...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <h2 className="text-xl font-semibold mt-6 mb-2">Demandes de Rendez-vous</h2>
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="p-3">Patient</th>
            <th className="p-3">Date</th>
            <th className="p-3">Heure</th>
            <th className="p-3">Statut</th>
            {isOwner && <th className="p-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((request) => (
            <tr key={request.id} className="border-b hover:bg-gray-100">
              <td className="p-3">{request.patientName}</td>
              <td className="p-3">{new Date(request.date).toLocaleDateString()}</td>
              <td className="p-3">{request.time}</td>
              <td className="p-3">{request.status}</td>
              {isOwner && request.status === "en attente" && (
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleAccept(request.id, request.patientId, request.date, request.time)}
                    className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleReject(request.id, request.patientId, request.date, request.time)}
                    className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                  >
                    Refuser
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
