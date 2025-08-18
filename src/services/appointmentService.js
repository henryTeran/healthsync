// src/services/appointmentService.js
import { Appointment } from "../models/Appointment";
import { db } from "../providers/firebase";
import { doc, addDoc, getDocs, query, where, collection, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getUserProfile } from "./profileService";
import { sendNotification, addNotification } from "./notificationService";


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
export const scheduleAppointmentReminder = async (appointment, reminderHours = 24) => {
  const { patientId, doctorId, date, time, id } = appointment;
  const appointmentDate = new Date(date);
  const reminderDate = new Date(appointmentDate.getTime() - reminderHours * 60 * 60 * 1000);

  try {
    // Programmer le rappel pour le patient
    await addNotification(patientId, {
      type: "appointment_reminder",
      message: `Rappel: Vous avez un rendez-vous demain à ${time}`,
      appointmentId: id,
      scheduledFor: reminderDate.toISOString(),
      read: false
    });

    // Programmer le rappel pour le médecin
    const patientProfile = await getUserProfile(patientId);
    await addNotification(doctorId, {
      type: "appointment_reminder",
      message: `Rappel: Rendez-vous avec ${patientProfile?.firstName} ${patientProfile?.lastName} demain à ${time}`,
      appointmentId: id,
      scheduledFor: reminderDate.toISOString(),
      read: false
    });

    console.log(`Rappels programmés pour ${reminderDate.toLocaleString()}`);
  } catch (error) {
    console.error("Erreur lors de la programmation des rappels:", error);
  }
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

    // Envoyer une notification au médecin
    const patientProfile = await getUserProfile(appointmentData.patientId);
    await addNotification(appointmentData.doctorId, {
      type: "new_appointment_request",
      message: `Nouvelle demande de RDV de ${patientProfile?.firstName} ${patientProfile?.lastName} pour le ${appointmentData.date} à ${appointmentData.time}`,
      patientId: appointmentData.patientId,
      appointmentId: appointmentRef.id,
      urgency: appointmentData.urgency || "normal",
      read: false
    });

    // Planifier un rappel automatique
    if (appointmentData.reminderTime && appointmentData.reminderTime > 0) {
      await scheduleAppointmentReminder(
        { id: appointmentRef.id, ...appointmentData }, 
        appointmentData.reminderTime
      );
    }

    return appointmentRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Envoie une notification de confirmation de rendez-vous
 */
export const sendAppointmentConfirmation = async (appointmentId, status, doctorId, patientId) => {
  try {
    const [doctorProfile, patientProfile] = await Promise.all([
      getUserProfile(doctorId),
      getUserProfile(patientId)
    ]);

    const appointment = await getAppointmentById(appointmentId);
    
    if (status === "accepté") {
      // Notification au patient
      await addNotification(patientId, {
        type: "appointment_confirmed",
        message: `Votre rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} du ${appointment.date} à ${appointment.time} a été confirmé`,
        appointmentId,
        read: false
      });

      // Programmer les rappels automatiques
      await scheduleAppointmentReminder(appointment, 24); // 24h avant
      await scheduleAppointmentReminder(appointment, 2);  // 2h avant
      
    } else if (status === "refusé") {
      // Notification au patient
      await addNotification(patientId, {
        type: "appointment_rejected",
        message: `Votre demande de rendez-vous avec Dr. ${doctorProfile?.firstName} ${doctorProfile?.lastName} du ${appointment.date} à ${appointment.time} a été refusée`,
        appointmentId,
        read: false
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la confirmation:", error);
  }
};

/**
 * Récupère un rendez-vous par son ID
 */
const getAppointmentById = async (appointmentId) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    const appointmentDoc = await getDoc(appointmentRef);
    
    if (appointmentDoc.exists()) {
      return { id: appointmentDoc.id, ...appointmentDoc.data() };
    }
    throw new Error("Rendez-vous introuvable");
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous:", error);
    throw error;
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