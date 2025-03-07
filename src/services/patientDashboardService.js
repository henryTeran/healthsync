import { db } from "../firebaseConfig"; // Import de la config Firebase
import { collection, query, where, getDocs } from "firebase/firestore";

// 🔹 Récupère les rappels de médicaments du patient
export const getMedicationReminders = async (userId) => {
  try {
    const q = query(collection(db, "medications"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const medications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      time: doc.data().time, // Heure de prise du médicament
    }));
    return medications;
  } catch (error) {
    console.error("Erreur lors de la récupération des médicaments:", error);
    return [];
  }
};

// 🔹 Récupère les prochains rendez-vous du patient
export const getUpcomingAppointments = async (userId) => {
  try {
    const q = query(collection(db, "appointments"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      date: doc.data().date,
      doctor: doc.data().doctorName,
    }));
    return appointments;
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous:", error);
    return [];
  }
};

// 🔹 Récupère le suivi des symptômes du patient
export const getSymptomTracking = async (userId) => {
  try {
    const q = query(collection(db, "symptoms"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const symptoms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      date: doc.data().date,
      symptom: doc.data().symptom,
      severity: doc.data().severity, // Gravité du symptôme (ex: 1 à 10)
    }));
    return symptoms;
  } catch (error) {
    console.error("Erreur lors de la récupération des symptômes:", error);
    return [];
  }
};

// 🔹 Vérifie s'il y a de nouveaux messages pour le patient
export const getNewMessages = async (userId) => {
  try {
    const q = query(collection(db, "messages"), where("receiverId", "==", userId), where("isRead", "==", false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size; // Nombre de messages non lus
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    return 0;
  }
};
