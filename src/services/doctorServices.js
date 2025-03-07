// src/services/doctorService.js
import { db } from "../providers/firebase";
import { query, collection, where, getDoc, getDocs, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 
import { getUserProfile } from "./profileService";

const auth = getAuth();

/**
 * Récupère la liste des patients autorisés pour un médecin donné
 */


export const getAuthorizedPatients = async (doctorId) => {
  try {
    const q = query(
      collection(db, "doctor_patient_links"),
      where("doctorId", "==", doctorId),
      where("authorized", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const patients = [];
    
    for (const document of querySnapshot.docs) {
      const linkData = document.data();
      const patientId = linkData.patientId; 
      const patientRef = doc(db, "users", patientId);
    
      const patientSnapshot = await getDoc(patientRef);

    
      if (patientSnapshot.exists()) {
        patients.push({
          id: patientId, // Garder l'ID du document
          ...patientSnapshot.data(), // Ajouter les infos du patient
        });
      }
    }
    return patients;
  } catch (error) {
    console.error("Erreur lors de la récupération des patients autorisés :", error);
    throw error;
  }
};

export const getAllDoctors = async () => {
  try {
    // Récupérer la liste des médecins depuis Firestore
    const doctorsSnapshot = await getDocs(collection(db, "users"));
    const doctorsList = [];
    
    // Pour chaque utilisateur, vérifier si c'est un médecin et récupérer ses informations
    for (const doc of doctorsSnapshot.docs) {
      const doctorData = doc.data();
      if (doctorData.type === "doctor") {
        // Récupérer la date d'inscription depuis Firebase Authentication
        const creationTime = auth.currentUser?.metadata?.creationTime || "N/A";
        const signupDate = creationTime;
        
        // Ajouter la date d'inscription et les autres informations du médecin
        doctorsList.push({
          id: doc.id, // Inclure l'ID du médecin ici
          ...doctorData,
          signupDate: signupDate, // Ajouter la date d'inscription
        });
      }
    }
    
    return doctorsList;
  } catch (error) {
    console.error("Erreur lors de la récupération des médecins :", error);
    return [];
  }
};