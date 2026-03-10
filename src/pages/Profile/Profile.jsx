import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile } from "../../features/profile";
import { AuthContext } from "../../contexts/AuthContext";
import { ListDoctorAvailable } from "./Patient/ListDoctorAvailable";

export const Profile = (Profil) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();


  
  const [formValues, setFormValues] = useState({
    lastName: "",
    firstName: "",
    age: "",
    gender: "",
    email: "",
    type: "",
    allergies: "", // Spécifique aux patients
    photoURL: null,
    mobileNumber: "", // Numéro de téléphone
    address: "", // Adresse
    postalCode: "", // Code postal
    state: "", // Ville
    country: "", // Pays
    status: "", // Statut (Actif/Non actif)
    medicalLicense: "", // Spécifique aux médecins
    education: "", // Spécifique aux médecins
    department: "", // Spécifique aux médecins
    designation: "", // Spécifique aux médecins
    about: "", // Spécifique aux médecins
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {let profileData;
        if (Profil.id === undefined) {
           profileData = await getUserProfile(user.uid);
        }else{
           const idprofil = Profil.id;
         profileData = await getUserProfile(idprofil);
        }
       
        setFormValues({ ...profileData, type: profileData.type || "patient" });
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []); //  Se recharge si `userId` ou `user` change

  if (isLoading) return <p className="text-center text-gray-600">Chargement...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-4">
      {/* Informations du profil */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          {/* Photo de profil */}
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
            <img
              src={formValues.photoURL || "/default-avatar.png"}
              alt="Profil"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">{`${formValues.firstName} ${formValues.lastName}`}</h1>
            <p className="text-gray-600">{formValues.type === "patient" ? "Patient" : "Médecin"}</p>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="mt-4 space-y-2">
          <p>Âge : {formValues.age || "Non spécifié"}</p>
          <p>Sexe : {formValues.gender ? formValues.gender.charAt(0).toUpperCase() + formValues.gender.slice(1) : "Non spécifié"}</p>
          <p>Email : {formValues.email}</p>
          <p>Téléphone : {formValues.mobileNumber || "Non spécifié"}</p>
          <p>Adresse : {formValues.address || "Non spécifiée"}</p>
          <p>Ville : {formValues.state || "Non spécifiée"}</p>
          <p>Pays : {formValues.country || "Non spécifié"}</p>
          <p>Status : {formValues.status ? formValues.status.charAt(0).toUpperCase() + formValues.status.slice(1) : "Non spécifié"}</p>

          {/* Champs spécifiques au patient */}
          {formValues.type === "patient" && <p>Allergies : {formValues.allergies || "Aucune"}</p>}

          {/* Champs spécifiques au médecin */}
          {formValues.type === "doctor" && (
            <>
              <p>Licence médicale : {formValues.medicalLicense || "Non spécifiée"}</p>
              <p>Éducation : {formValues.education || "Non spécifiée"}</p>
              <p>Département : {formValues.department || "Non spécifié"}</p>
              <p>Fonction : {formValues.designation || "Non spécifiée"}</p>
              <p>À propos : {formValues.about || "Non spécifié"}</p>
            </>
          )}
        </div>

        {/* Bouton Modifier */}
        {(
          <button
            onClick={() => navigate("/editprofile")}
            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
          >
            Modifier le profil
          </button>
        )}
      </div>

      {/* 🔥 Visible seulement si type est patient */}
      {formValues.type === "patient" && <ListDoctorAvailable />}
    </div>
  );
};
