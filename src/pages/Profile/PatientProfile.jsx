import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../services/profileService";
import { AuthContext } from "../../contexts/AuthContext";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../../providers/firebase";
import PropTypes from "prop-types";
import { ListDoctorAvailable } from "./Patient/ListDoctorAvailable";

export const PatientProfile = () => {
  const { user } = useContext(AuthContext);
  const { userId: paramUserId } = useParams(); // Récupération de l'ID dans l'URL
  const navigate = useNavigate();

  const userId = paramUserId || user?.uid; // Si pas d'userId dans l'URL, utiliser l'ID de l'utilisateur connecté
  const isOwner = user?.uid === userId;
  const isDoctor = user?.userType === "doctor";

  console.log("🛠️ DEBUG: userId =", userId, "| paramUserId =", paramUserId, "| user.uid =", user?.uid);
  console.log("🛠️ DEBUG: isOwner =", isOwner);
  console.log("🛠️ DEBUG: isDoctor =", isDoctor);
  console.log("🛠️ DEBUG: user =", user);

  const [patientProfile, setPatientProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setError("Utilisateur non connecté.");
      setIsLoading(false);
      return;
    }

    // Récupération en temps réel du profil patient ou utilisateur connecté
    const unsubscribe = onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) {
        setPatientProfile({ id: docSnap.id, ...docSnap.data() });
        setError("");
      } else {
        setError("Profil du patient introuvable.");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (isLoading) return <p className="text-center text-gray-600">Chargement...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
            <img src={patientProfile?.photoURL || "/default-avatar.png"} alt="Profil" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{`${patientProfile?.firstName} ${patientProfile?.lastName}`}</h1>
            <p className="text-gray-600">Patient</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p>Âge : {patientProfile?.age || "Non spécifié"}</p>
          <p>Sexe : {patientProfile?.gender ? `${patientProfile.gender[0].toUpperCase()}${patientProfile.gender.slice(1)}` : "Non spécifié"}</p>
          <p>Email : {patientProfile?.email}</p>
          <p>Téléphone : {patientProfile?.mobileNumber || "Non spécifié"}</p>
          <p>Adresse : {patientProfile?.address || "Non spécifiée"}</p>
          <p>Ville : {patientProfile?.state || "Non spécifiée"}</p>
          <p>Pays : {patientProfile?.country || "Non spécifié"}</p>
          <p>Status : {patientProfile?.status ? `${patientProfile.status[0].toUpperCase()}${patientProfile.status.slice(1)}` : "Non spécifié"}</p>
          <p>Allergies : {patientProfile?.allergies || "Aucune"}</p>
        </div>

        {/* Bouton Modifier visible seulement si c'est son propre profil */}
        {isOwner && (
          <button
            onClick={() => navigate("/editprofile")}
            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Modifier le profil
          </button>
        )}
      </div>

      {/* 🔥 Liste des médecins disponibles : visible uniquement pour le patient lui-même */}
      {!isDoctor && isOwner && <ListDoctorAvailable />}
    </div>
  );
};

PatientProfile.propTypes = {
  navigate: PropTypes.func,
};
