// src/services/appointmentService.js
import { Appointment } from "../models/Appointment";
import { db } from "../providers/firebase";
import { doc, addDoc, getDocs, query, where, collection, deleteDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getUserProfile } from "./profileService";
import { sendNotification } from "./notificationService";


export const getAppointmentsByUser = async (userId, userType) => {
  try {
    // Vérification du filtre appliqué
    const field = userType === "patient" ? "patientId" : "doctorId";
 
    const q = query(collection(db, "appointments"), where(field, "==", userId));

    const querySnapshot = await getDocs(q);
    
    // Vérifier si des données existent
    if (querySnapshot.empty) {
      return [];
    } 
   
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  } catch (error) {
    console.error(" Erreur lors de la récupération des rendez-vous :", error);
    throw new Error(error.message);
  }
};

export const updateAppointment = async (appointmentId, updatedData) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, updatedData);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteAppointment = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await deleteDoc(appointmentRef);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Programme un rappel de rendez-vous X heures avant.
 */
export const scheduleAppointmentReminder = async (appointment) => {
  const { patientId, date, reminderTime } = appointment;
  const appointmentDate = new Date(date);
  const reminderDate = new Date(appointmentDate.getTime() - reminderTime * 60 * 60 * 1000); // X heures avant

  const delay = reminderDate - new Date(); // Temps restant avant l'envoi du rappel
  if (delay < 0) {
    console.log("Le rappel est déjà passé, aucun envoi.");
    return;
  }

  setTimeout(() => {
    sendNotification(patientId, "Rappel de RDV 🏥", `Votre rendez-vous est prévu le ${new Date(date).toLocaleString()}`);
  }, delay);

  console.log(`Notification programmée pour ${reminderDate.toLocaleString()}`);
};

export const createAppointment = async (appointmentData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("Utilisateur non authentifié.");
    }

    appointmentData.status = "en attente"; // Statut du RDV
    const appointmentRef = await addDoc(collection(db, "appointments"), appointmentData);

    console.log("RDV ajouté avec succès :", appointmentRef.id);

    // Envoyer une notification au patient
    sendNotification(appointmentData.patientId, "Nouveau RDV 🏥", "Un rendez-vous a été planifié pour vous.");

    // Planifier un rappel automatique
    scheduleAppointmentReminder({ id: appointmentRef.id, ...appointmentData });

    return appointmentRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getDoctorAvailability = async (doctorId) => {
  try {
    const q = query(collection(db, "availabilities"), where("doctorId", "==", doctorId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur lors de la récupération des disponibilités :", error);
    throw new Error("Impossible de récupérer les disponibilités.");
  }
};

/**
 * Ajoute une disponibilité pour un docteur.
 */
export const addDoctorAvailability = async (doctorId, startDate, endDate, type) => {
  try {
    const newAvailability = {
      doctorId,
      start: startDate,
      end: endDate,
      type, // Exemple : "vacances", "réunion", "maladie", etc.
    };
    
    const docRef = await addDoc(collection(db, "availabilities"), newAvailability);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout de disponibilité :", error);
    throw new Error("Impossible d'ajouter la disponibilité.");
  }
};

/**
 * Supprime une disponibilité.
 */
export const deleteDoctorAvailability = async (availabilityId) => {
  try {
    await deleteDoc(doc(db, "availabilities", availabilityId));
  } catch (error) {
    console.error("Erreur lors de la suppression de la disponibilité :", error);
    throw new Error("Impossible de supprimer la disponibilité.");
  }
};

