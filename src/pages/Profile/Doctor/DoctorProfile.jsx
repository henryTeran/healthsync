import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../../services/profileService";
import { AuthContext } from "../../../contexts/AuthContext";
import { updateAppointment } from "../../../services/appointmentService";
import { addNotification } from "../../../services/notificationService";
import { ProfileWrapper } from "../../WithNavigation";
import { onSnapshot, collection, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../../../providers/firebase";

export const DoctorProfile = () => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams(); // Récupérer doctorId s'il est présent dans l'URL
  const navigate = useNavigate();

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [followAppointmentRequest, setFollowAppointmentRequest] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Déterminer quel ID utiliser (soit celui dans l'URL, soit celui du médecin connecté)
  const doctorId = paramDoctorId || user?.uid;
  const isOwner = user?.uid === doctorId; // Vérifie si c'est son propre profil

  console.log("🛠️ DEBUG: doctorId =", doctorId, "| user.uid =", user?.uid);
  console.log("🛠️ DEBUG: isOwner =", isOwner);

  useEffect(() => {
    if (!doctorId) {
      setError("ID du médecin introuvable.");
      setIsLoading(false);
      return;
    }

    // 🔥 Charger les infos du médecin (en direct depuis Firebase)
    const fetchDoctorProfile = async () => {
      try {
        const docRef = doc(db, "users", doctorId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDoctorProfile({ id: docSnap.id, ...docSnap.data() });
          setError(""); // Réinitialiser les erreurs en cas de succès
        } else {
          setError("Profil du médecin introuvable.");
        }
      } catch (err) {
        setError("Erreur lors du chargement du profil.");
      } finally {
        setIsLoading(false);
      }
    };

    // 🔥 Charger les patients autorisés
    const fetchAuthorizedPatients = () => {
      const patientsQuery = query(collection(db, "doctor_patient_links"), where("doctorId", "==", doctorId));
      return onSnapshot(patientsQuery, async (snapshot) => {
        const patientIds = snapshot.docs.map((doc) => doc.data().patientId);
        if (patientIds.length > 0) {
          const patientsData = await Promise.all(
            patientIds.map(async (id) => {
              const patientDoc = await getUserProfile(id);
              return patientDoc ? { id, ...patientDoc } : null;
            })
          );
          setAuthorizedPatients(patientsData.filter(Boolean));
        } else {
          setAuthorizedPatients([]);
        }
      });
    };

    // 🔥 Charger les rendez-vous en attente
    const fetchAppointments = () => {
      const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId));
      return onSnapshot(appointmentsQuery, (snapshot) => {
        setFollowAppointmentRequest(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    };

    fetchDoctorProfile();
    const unsubscribePatients = fetchAuthorizedPatients();
    const unsubscribeAppointments = fetchAppointments();

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
    };
  }, [doctorId]);

  // ✅ Gérer l'acceptation d'un RDV
  const handleAcceptAppointmentRequest = async (appointmentId, patientId, date, time) => {
    try {
      if (!user) throw new Error("Informations utilisateur manquantes.");
      await updateAppointment(appointmentId, { status: "accepté" });
      const datauser = await getUserProfile(user.uid);
      await addNotification(patientId, {
        type: "reponse_appointment_request",
        message: `Le Dr ${datauser.firstName} ${datauser.lastName} a accepté votre RDV du ${date} à ${time}.`,
        patientId,
        appointmentId,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // ✅ Gérer le refus d'un RDV
  const handleRejectAppointmentRequest = async (appointmentId, patientId, date, time) => {
    try {
      if (!user) throw new Error("Informations utilisateur manquantes.");
      await updateAppointment(appointmentId, { status: "refusé" });
      await addNotification(patientId, {
        type: "reponse_appointment_request",
        message: `Le Dr ${user.firstName} ${user.lastName} a refusé votre RDV du ${date} à ${time}.`,
        patientId,
        appointmentId,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  if (isLoading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Profil Médecin</h1>
      <ProfileWrapper id={doctorId} />

      <h2 className="text-xl font-semibold mb-2">Patients Suivis</h2>
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="p-3">Nom</th>
            <th className="p-3">Prénom</th>
            <th className="p-3">Âge</th>
            <th className="p-3">Sexe</th>
            <th className="p-3">Dernière Consultation</th>
            {isOwner && <th className="p-3">Action</th>}
          </tr>
        </thead>
        <tbody>
          {authorizedPatients.map((patient) => (
            <tr key={patient.id} className="border-b hover:bg-gray-100">
              <td className="p-3">{patient.firstName}</td>
              <td className="p-3">{patient.lastName}</td>
              <td className="p-3">{patient.age}</td>
              <td className="p-3">{patient.gender}</td>
              <td className="p-3">{patient.lastConsultationDate || "N/A"}</td>
              {isOwner && (
                <td className="p-3">
                  <button
                    onClick={() => navigate(`/patientprofile/${patient.id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Voir Profil
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mt-6 mb-2">Demandes de Rendez-vous</h2>
      <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-blue-500 text-white">
            <th className="p-3">Patient</th>
            <th className="p-3">Date</th>
            <th className="p-3">Heure</th>
            <th className="p-3">Statut</th>
            {isOwner && 
            <th className="p-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {followAppointmentRequest.map((request) => (
            <tr key={request.id} className="border-b hover:bg-gray-100">
              <td className="p-3">{request.firstName} {request.lastName}</td>
              <td className="p-3">{new Date(request.date).toLocaleDateString()}</td>
              <td className="p-3">{request.time}</td>
              <td className="p-3">{request.status}</td>
              {isOwner && request.status === "en attente" && (
                <td className="p-3">
                  <button
                    onClick={() => handleAcceptAppointmentRequest(request.id, request.patientId, request.date, request.time)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleRejectAppointmentRequest(request.id, request.patientId, request.date, request.time)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Refuser
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
