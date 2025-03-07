// src/services/symptomService.js

import { db } from "../providers/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { Symptom } from "../models/Symptom";

/**
 *  Ajoute un nouveau symptôme pour un utilisateur avec mise à jour en temps réel.
 */
export const addSymptom = async (userId, symptomData) => {
  try {
    const symptom = new Symptom({ userId, ...symptomData });
    symptom.validate();
    await addDoc(collection(db, "symptoms"), symptom.toFirestore());
  } catch (error) {
    console.error("Erreur lors de l'ajout du symptôme :", error);
    throw error;
  }
};

/**
 *  Récupère tous les symptômes en temps réel pour un utilisateur.
 */
export const getSymptomsByUserRealtime = (userId, callback) => {
  const q = query(collection(db, "symptoms"), where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {

    const updatedSymptoms = snapshot.docs.map((doc) => Symptom.fromFirestore(doc));
    callback(updatedSymptoms);
  });
};

/**
 *  Met à jour un symptôme existant et écoute les changements.
 */
export const updateSymptom = async (symptomId, updatedData) => {
  try {
    const symptomRef = doc(db, "symptoms", symptomId);
    await updateDoc(symptomRef, updatedData);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du symptôme :", error);
    throw error;
  }
};

/**
 *  Supprime un symptôme et met à jour l'affichage en direct.
 */
export const deleteSymptom = async (symptomId) => {
  try {
    const symptomRef = doc(db, "symptoms", symptomId);
    await deleteDoc(symptomRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du symptôme :", error);
    throw error;
  }
};
