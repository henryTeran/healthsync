// src/services/followService.js
import { db } from "../providers/firebase";
import { doc, setDoc, getDocs, query, where, updateDoc, collection } from "firebase/firestore";
import { addNotification } from "./notificationService";
import { getUserProfile } from "./profileService";

export const requestFollow = async (patientId, doctorId) => {
  try {
    const linkRef = doc(db, "doctor_patient_links", `${doctorId}_${patientId}`);
    await setDoc(linkRef, {
      patientId,
      doctorId,
      authorized: false, // Par défaut, la demande n'est pas autorisée
      createdAt: new Date().toISOString(),
    });
    // Envoyer une notification au médecin
    const patientProfile = await getUserProfile(patientId);
    const firstName = patientProfile?.firstName || "Inconnu";
    const lastName =  patientProfile?.lastName || "Inconnu";
    const notificationData = {
      type: "follow_request",
      message: `Le patient ${firstName} ${lastName}  souhaite que vous le suiviez.`,
      patientId,
      read: false,
    };

    await addNotification(doctorId, notificationData);

  } catch (error) {
    console.error("Erreur lors de l'envoi de la demande de suivi :", error);
    throw error;
  }
};


export const handleFollowRequest = async (patientId, doctorId, isAuthorized) => {
  try {
    const linkRef = doc(db, "doctor_patient_links", `${doctorId}_${patientId}`);
    await updateDoc(linkRef, { authorized: isAuthorized });

    // Envoyer une notification au patient
    const patientProfile = await getUserProfile(doctorId);
    const firstName = patientProfile?.firstName || "Inconnu";
    const lastName =  patientProfile?.lastName || "Inconnu";

    const notificationData = {
      type: "follow_response",
      message: isAuthorized
        ? `Le médecin ${firstName} ${lastName} a accepté votre demande de suivi.`
        : `Le médecin ${firstName} ${lastName} a refusé votre demande de suivi.`,
      patientId: patientId,
      read: false,
    };

    await addNotification(patientId, notificationData);
  } catch (error) {
    console.error("Erreur lors du traitement de la demande de suivi :", error);
    throw error;
  }
};


export const getFollowRequests = async (doctorId) => {
  try {
    const q = query(
      collection(db, "doctor_patient_links"),
      where("doctorId", "==", doctorId),
      where("authorized", "==", false)
    );
    const querySnapshot = await getDocs(q);

    // Récupérer toutes les demandes de suivi
    const requests = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(), // Conserver toutes les anciennes données
    }));

    // Récupérer les profils des patients en parallèle
    const requestsWithPatientData = await Promise.all(
      requests.map(async (request) => {
        try {
          const patientProfile = await getUserProfile(request.patientId);
          return {
            ...request,
            firstName: patientProfile?.firstName || "Inconnu",
            lastName: patientProfile?.lastName || "Inconnu",
          };
        } catch (error) {
          console.error(`Erreur lors de la récupération du profil du patient ${request.patientId} :`, error);
          return {
            ...request,
            firstName: "Erreur",
            lastName: "Erreur",
          };
        }
      })
    );

    return requestsWithPatientData;
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes de suivi :", error);
    throw error;
  }
};