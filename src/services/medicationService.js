// src/services/medicationService.js
import { db } from "../providers/firebase";
import { collection, addDoc, getDocs, deleteDoc, query, where, doc, updateDoc } from "firebase/firestore";
import { differenceInDays } from "date-fns";
/**
 * Ajoute un médicament lié à une prescription.
 */
export const addMedication = async (idPrescription, medication, patientId, doctorId) => {
  try {
    const medicationData = {
      idPrescription,
      patientId,
      createdBy: doctorId,
      ...medication,
    };

    const docRef = await addDoc(collection(db, "medications"), medicationData);
    return docRef.id;
  } catch (error) {
    console.error("Erreur lors de l'ajout du médicament :", error);
    throw error;
  }
};

/**
 * Récupère les médicaments liés à une prescription.
 */
export const getMedicationsByPrescription = async (idPrescription) => {
  try {
    const q = query(collection(db, "medications"), where("idPrescription", "==", idPrescription));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur lors de la récupération des médicaments :", error);
    throw error;
  }
};

/**
 * Supprime un médicament.
 */
export const deleteMedication = async (idMedication) => {
  try {
    const medicationRef = doc(db, "medications", idMedication);
    await deleteDoc(medicationRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du médicament :", error);
    throw error;
  }
};

export const generateMedicationReminders = (medications) => {
  let reminders = [];

  medications.forEach((med) => {
    const { frequency, name } = med;
    const intervals = 24 / frequency; // Calcul des heures entre chaque prise
    let time = 8; // On commence à 8h du matin

    for (let i = 0; i < frequency; i++) {
      reminders.push({
        medicationName: name,
        time: `${String(time).padStart(2, "0")}:00`,
      });
      time += intervals;
    }
  });

  return reminders;
};

export const generateMedicationSchedule = (medications, startDate) => {
  let schedule = [];
  const start = new Date(startDate);

  medications.forEach((med) => {
    const { frequency, name } = med;
    const interval = 24 / frequency; // Nombre d'heures entre chaque prise
    let time = 8; // Commence à 08:00

    for (let i = 0; i < frequency; i++) {
      const reminderTime = new Date(start);
      reminderTime.setHours(time, 0, 0); // Définit l'heure
      schedule.push({
        medicationName: name,
        time: reminderTime.toISOString(),
      });
      time += interval;
    }
  });

  return schedule;
};

export const addMedicationToUser = async (medication, startDate, durationText, idPrescription) => {
  console.log(medication, startDate, durationText);
  if (!medication || !startDate || !durationText) return alert("⚠️ Veuillez remplir tous les champs.");

  try {
    const userMedicationsRef = collection(db, "userMedications");

    // Vérifier si le médicament est déjà suivi
    const q = query(userMedicationsRef, where("idMedication", "==", medication.id), where("name", "==", medication.name));
    const existingMedications = await getDocs(q);
    console.log("Existing medications:", existingMedications);


    if (!existingMedications.empty) {
      console.log(`⚠️ Le médicament ${medication.name} est déjà suivi.`);
      return;
    }

    // 📅 Extraire la durée en jours
    const durationInDays = extractDuration(durationText);
    console.log("📌 Duration in days:", durationInDays);

    if (!durationInDays) {
      console.log("⚠️ Durée invalide.");
      return;
    }

    // 📆 Calculer la date de fin
    const endDate = calculateEndDate(startDate, durationText);
    console.log("📌 Duration in days:", durationInDays, "End Date:", endDate);

    // Extraire la fréquence en nombre (ex: "2 fois par jour" → 2)
    const frequencyPerDay = extractFrequency(medication.frequency);
    console.log("📌 Frequency per day:", frequencyPerDay);

    if (!frequencyPerDay) {
      console.log("⚠️ Fréquence invalide.");
      return;
    }
    console.log("📌 Frequency per day:", frequencyPerDay);

    // ⏰ Générer les horaires de prise
    const times = generateTimes(medication.frequency);
    console.log("📌 Horaires de prise :", times);

    //Ajouter le médicament dans la base de données
    await addDoc(userMedicationsRef, {
      idMedication: medication.id,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency, // On garde la fréquence originale
      duration: durationInDays, 
      startDate: startDate,
      endDate: endDate,
      times: times,
      status: "active", // Ajout d'un statut pour un meilleur suivi
    });

    console.log(` Médicament ${medication.name} ajouté avec succès !`);


 // 🔍 Rechercher le médicament dans Firestore par `idPrescription` et `name`
    const medRef = query(
      collection(db, "medications"),
      where("idPrescription", "==", idPrescription),
      where("name", "==", medication.name)
    );

    const snapshot = await getDocs(medRef);

    if (snapshot.empty) {
      console.log(`⚠️ Aucun médicament trouvé avec l'idPrescription: ${idPrescription} et name: ${medication.name}`);
      return;
    }
    // 🛠️ Mise à jour des dates de début et de fin
    snapshot.forEach(async (docSnap) => {
    await updateDoc(doc(db, "medications", docSnap.id), {
      startDate: startDate,
      endDate: endDate,
    });

    console.log(`✅ Médicament ${medication.name} mis à jour avec startDate: ${startDate} et endDate: ${endDate}`);
    });
    
    return times;
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du médicament :", error);
  }
};



export const extractFrequency = (text) => {
  const match = text.match(/(\d+) fois par jour/);
  return match ? parseInt(match[1], 10) : null;
};

export const extractDuration = (text) => {
  let match = text.match(/(\d+) jour/);
  if (match) return parseInt(match[1], 10);
  
  match = text.match(/(\d+) semaine/);
  if (match) return parseInt(match[1], 10) * 7; // Convertir semaines en jours
  
  match = text.match(/(\d+) mois/);
  if (match) return parseInt(match[1], 10) * 30; // Approximation d'un mois à 30 jours
  
  return null;
};

export const calculateEndDate = (startDate, durationText) => {
  const duration = extractDuration(durationText);
  if (!startDate || !duration) return null;

  const start = new Date(startDate);
  start.setDate(start.getDate() + duration - 1);
  return start.toISOString().split("T")[0];
};

export const generateTimes = (frequencyText) => {
  const frequency = extractFrequency(frequencyText);
  if (!frequency) return [];

  const times = [];
  const startHour = 8; // Commencer à 8h du matin
  const interval = Math.floor(12 / frequency); // Répartir sur 12h (08h-20h)
  
  for (let i = 0; i < frequency; i++) {
    times.push(`${startHour + i * interval}:00`);
  }

  return times;
};

export const updateMedication = async (medicationId, updatedData) => {
  try {
    const medicationRef = doc(db, "medications", medicationId);
    await updateDoc(medicationRef, updatedData);
    console.log(`✅ Médicament ${medicationId} mis à jour avec succès !`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du médicament :", error);
    throw error;
  }
};