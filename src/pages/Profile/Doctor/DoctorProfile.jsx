import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";

import { AuthContext } from "../../../contexts/AuthContext";
import { ProfileWrapper } from "../../WithNavigation";
import { FollowedTable } from "./FollowedTable";
import { AppointmentRequestsTable } from "./AppointmentsRequestTabe";

export const DoctorProfile = () => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Déterminer l'ID du médecin (connecté ou via URL)
  const doctorId = paramDoctorId || user?.uid;
  const isOwner = user?.uid === doctorId;

  // Simule le chargement (ou effectue un fetch réel si nécessaire)
  useEffect(() => {
    if (!doctorId) {
      setError("Aucun médecin trouvé.");
      setIsLoading(false);
      return;
    }

    // Simuler un chargement (tu peux ici ajouter une requête Firestore ou autre)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // 500ms de chargement

    return () => clearTimeout(timer);
  }, [doctorId]);

  if (isLoading) return <p>Chargement...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Profil Médecin</h1>
      <ProfileWrapper id={doctorId} />
      <FollowedTable />
      {isOwner && <AppointmentRequestsTable />}
    </div>
  );
};
