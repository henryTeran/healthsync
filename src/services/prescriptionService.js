// src/services/prescriptionService.js
import { db } from "../providers/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, getDoc } from "firebase/firestore";
import { getMedicationsByPrescription } from "./medicationService";

/**
 * Sauvegarde une nouvelle prescription en Firebase.
 */
export const savePrescription = async (createdBy, patientId) => {
  try {
    const prescriptionData = {
      createdBy,
      patientId,
      creationDate: new Date().toISOString(),
      status: "send",
    };

    const docRef = await addDoc(collection(db, "prescriptions"), prescriptionData);
    return docRef.id; // Retourne l'ID de la prescription créée
  } catch (error) {
    console.error("Erreur lors de l'ajout de la prescription :", error);
    throw error;
  }
};

/**
 * Récupère les prescriptions d'un patient.
 */
export const getPrescriptionsByPatient = async (patientId) => {
  try {
    const q = query(collection(db, "prescriptions"), where("patientId", "==", patientId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur lors de la récupération des prescriptions :", error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une prescription.
 */
export const updatePrescriptionStatus = async (idPrescription, newStatus) => {
  try {
    const prescriptionRef = doc(db, "prescriptions", idPrescription);
    await updateDoc(prescriptionRef, { status: newStatus });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la prescription :", error);
    throw error;
  }
};

/**
 * Met à jour le statut de la prescription après acceptation du patient.
 */
export const acceptPrescription = async (prescriptionId) => {
  try {
    const prescriptionRef = doc(db, "prescriptions", prescriptionId);
    await updateDoc(prescriptionRef, { status: "validated" });
    console.log("Prescription acceptée !");
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la prescription :", error);
    throw error;
  }
};

/**
 * Récupère une prescription par son ID.
 */
export const getPrescriptionById = async (idPrescription) => {
  try {
    const prescriptionRef = doc(db, "prescriptions", idPrescription);
    const docSnapshot = await getDoc(prescriptionRef);
    

    if (docSnapshot.exists()) {
      console.log("Prescription trouvée :", docSnapshot.data());
      const prescriptionData =  {id: docSnapshot.id, ...docSnapshot.data()};

      const medications = await getMedicationsByPrescription(idPrescription);


      return {...prescriptionData, medications };
    } else {
      console.log("Aucune prescription trouvée avec cet ID");
      return null;  // Retourne null si la prescription n'existe pas
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la prescription par ID :", error);
    throw error;
  }
};

/**
 * Enregistre la date de début de prise des médicaments.
 */
export const setMedicationStartDate = async (prescriptionId, startDate) => {
  try {
    const prescriptionRef = doc(db, "prescriptions", prescriptionId);
    await updateDoc(prescriptionRef, { startDate });
    console.log("Date de début enregistrée !");
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la date de début :", error);
    throw error;
  }
};


export const updatePrescription = async (prescriptionId, updatedData) => {
  try {
    const prescriptionRef = doc(db, "prescriptions", prescriptionId);
    await updateDoc(prescriptionRef, updatedData);
    console.log(" Prescription mise à jour avec succès !");
  } catch (error) {
    console.error(" Erreur lors de la mise à jour de la prescription :", error);
    throw error;
  }
};


export const getPrescriptionsByUser = async (userId) => {
  try {
    const q = query(collection(db, "prescriptions"), 
      where("createdBy", "==", userId) // Pour récupérer les prescriptions créées par ce médecin
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(" Erreur lors de la récupération des prescriptions :", error);
    throw error;
  }
};