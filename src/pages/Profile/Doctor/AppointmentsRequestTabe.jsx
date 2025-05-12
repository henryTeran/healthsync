import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { db } from "../../../providers/firebase";
import { getUserProfile } from "../../../services/profileService";
import { updateAppointment } from "../../../services/appointmentService";
import { addNotification } from "../../../services/notificationService";
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
      const doctorData = await getUserProfile(user.uid);
      await addNotification(patientId, {
        type: "reponse_appointment_request",
        message: `Le Dr ${doctorData.firstName} ${doctorData.lastName} a accepté votre RDV du ${date} à ${time}.`,
        patientId,
        appointmentId,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReject = async (appointmentId, patientId, date, time) => {
    try {
      await updateAppointment(appointmentId, { status: "refusé" });
      const doctorData = await getUserProfile(user.uid);
      await addNotification(patientId, {
        type: "reponse_appointment_request",
        message: `Le Dr ${doctorData.firstName} ${doctorData.lastName} a refusé votre RDV du ${date} à ${time}.`,
        patientId,
        appointmentId,
      });
    } catch (error) {
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
