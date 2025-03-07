// src/services/doctorService.js
import { db } from "../providers/firebase";
import { query, collection, where, getDocs, getDoc, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 

const auth = getAuth();

/**
 * Récupère la liste des médecins autorisés pour un patient donné
 */
export const getAuthorizedDoctors = async (patientId) => {
  try {
    const q = query(
      collection(db, "doctor_patient_links"),
      where("patientId", "==", patientId),
      where("authorized", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const doctors = [];

    for (const document of querySnapshot.docs) {
      const doctorData = document.data();
      // Récupérer les détails du médecin depuis la collection "users"
      const doctorId = doctorData.doctorId; // On suppose que c'est l'ID du document dans "users"
      
      const doctorRef = doc(db, "users", doctorId);
      const doctorSnapshot = await getDoc(doctorRef);
      
      if (doctorSnapshot.exists()) {
        doctors.push({ 
          id: doctorId, 
          ...doctorSnapshot.data() });
        }
      }
    return doctors;
  } catch (error) {
    console.error("Erreur lors de la récupération des médecins autorisés :", error);
    return [];
  }
};

export const getAllPatients = async () => {
  try {
    // Récupérer la liste des médecins depuis Firestore
    const patientsSnapshot = await getDocs(collection(db, "users"));
    const patientsList = [];
    
    // Pour chaque utilisateur, vérifier si c'est un médecin et récupérer ses informations
    for (const doc of patientsSnapshot.docs) {
      const patientData = doc.data();
      if (patientData.type === "patient") {
        // Récupérer la date d'inscription depuis Firebase Authentication
        const creationTime = auth.currentUser?.metadata?.creationTime || "N/A";
        const signupDate = creationTime;
        
        // Ajouter la date d'inscription et les autres informations du médecin
        patientsList.push({
          id: doc.id,
          ...patientData,
          signupDate: signupDate, // Ajouter la date d'inscription
        });
      }
    }
    
    return patientsList;
    } catch (error) {
      console.error("Erreur lors de la récupération des patients :", error);
      return [];
    }
  };

  export const addMedicalHistory = async (patientId, historyData) => {
    const docId = `${patientId}_history_${Date.now()}`;
    await setDoc(doc(db, "medicalHistory", docId), { ...historyData, patientId });
  };
  
  export const getMedicalHistoryByUser = async (patientId) => {
    const q = query(collection(db, "medicalHistory"), where("userId", "==", patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };