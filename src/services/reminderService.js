import { db } from "../providers/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { Reminder } from "../models/Reminder";
import { sendNotification } from "./notificationService";
import { generateTimes } from "./medicationService";

export const addReminder = async (userId, medication) => {
  try {
    const reminderData = {
      userId,
      medicationId: medication.id,
      medicationName: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      startDate: medication.startDate,
      endDate: medication.endDate,
      times: medication.times, // Liste des horaires de prise
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "reminders"), reminderData);
    console.log("✅ Rappel ajouté avec succès :", docRef.id);

    // ⚡ Planifier la notification automatique
    scheduleMedicationReminders(userId, medication);

    return docRef.id;
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du rappel :", error);
    throw error;
  }
};

const scheduleNotification = async (userId, reminderId, reminderData) => {
  try {
    const reminderTime = new Date(reminderData.dateTime);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(async () => {
        console.log("📢 Envoi de la notification pour le rappel :", reminderId);
        await sendNotification(
          userId,
          "⏰ Rappel : " + reminderData.title,
          `N'oubliez pas : ${reminderData.description || "C'est l'heure de votre rappel !"}`
        );
      }, delay);
    } else {
      console.warn("⏳ Rappel déjà passé, pas de notification programmée.");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la planification de la notification :", error);
  }
};

/**
 * 🔹 Récupérer tous les rappels en temps réel.
 */
export const getRemindersByUserRealtime = (userId, callback) => {
  const q = query(collection(db, "reminders"), where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const reminders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(reminders);
  });
};

/**
 * 🔹 Mettre à jour un rappel.
 */
export const updateReminder = async (reminderId, updatedData) => {
  try {
    const reminderRef = doc(db, "reminders", reminderId);
    await updateDoc(reminderRef, updatedData);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du rappel :", error);
    throw error;
  }
};


export const deleteReminder = async (reminderId) => {
  try {
    await deleteDoc(doc(db, "reminders", reminderId));
    console.log("✅ Rappel supprimé :", reminderId);
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du rappel :", error);
    throw error;
  }
};


/**
 * ✅ Écoute et envoi automatique des rappels
 */
export const listenForReminders = (userId) => {
  const q = query(collection(db, "reminders"), where("userId", "==", userId));

  return onSnapshot(q, async (snapshot) => {
    const now = new Date();
    
    snapshot.docs.forEach(async (docSnap) => {
      const reminder = docSnap.data();
      const reminderTime = new Date(reminder.time);

      if (reminderTime <= now && !reminder.sent) {
        console.log("📢 Envoi du rappel :", reminder.title);
        await sendNotification(userId, reminder.title, reminder.message);
        await updateReminder(docSnap.id, { sent: true });
      }
    });
  });
};


// export const scheduleMedicationReminders = async (userId, medications, startDate) => {
//   try {
//     for (const med of medications) {
//       const reminders = generateReminders(med, startDate);
//       for (const reminder of reminders) {
//         await addReminder(userId, reminder);
//       }
//     }
//     console.log("✅ Rappels programmés avec succès !");
//   } catch (error) {
//     console.error("❌ Erreur lors de la programmation des rappels :", error);
//   }
// };

// Fonction pour générer les rappels à partir des médicaments
const generateReminders = (med, startDate) => {
  let reminders = [];
  for (let i = 0; i < med.duration; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    reminders.push({
      title: `💊 Prise de ${med.name}`,
      dateTime: date.toISOString(),
      notificationType: "push", // Par défaut, peut être changé
      status: "pending",
    });
  }
  return reminders;
};

export const updateMedicationSchedule = async (prescriptionId, newStartDate) => {
  try {
    // Récupérer tous les médicaments liés à la prescription
    const medQuery = query(collection(db, "medications"), where("idPrescription", "==", prescriptionId));
    const medSnapshot = await getDocs(medQuery);

    const batchUpdates = [];

    medSnapshot.forEach((medDoc) => {
      const medicationRef = doc(db, "medications", medDoc.id);
      const medicationData = medDoc.data();

      // Calculer la nouvelle date de fin en fonction de la durée du traitement
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + (medicationData.duration || 0));

      // Préparer la mise à jour des dates
      batchUpdates.push(updateDoc(medicationRef, {
        startDate: newStartDate,
        endDate: newEndDate.toISOString().split("T")[0], // Format YYYY-MM-DD
      }));
    });

    // Appliquer toutes les mises à jour en parallèle
    await Promise.all(batchUpdates);

    console.log("✅ Programme des médicaments mis à jour avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du programme des médicaments :", error);
    throw error;
  }
};

// 🔥 Fonction pour programmer les rappels de prise de médicaments
export const scheduleMedicationReminders = async (userId, medication) => {
  try {
    const remindersRef = collection(db, "reminders");

    // Générer les heures de prise
    const times = generateTimes(medication.frequency);

    // Vérifier si les rappels existent déjà
    const q = query(remindersRef, where("idMedication", "==", medication.id));
    const existingReminders = await getDocs(q);

    if (!existingReminders.empty) {
      console.log("⚠️ Les rappels existent déjà.");
      return;
    }

    // 📅 Ajouter un rappel pour chaque heure de prise
    for (let time of times) {
      await addDoc(remindersRef, {
        userId,
        idMedication: medication.id,
        title: `Rappel Médicament : ${medication.name}`,
        dateTime: `${medication.startDate}T${time}:00`,
        status: "pending",
      });
    }

    console.log("✅ Rappels de prise de médicaments programmés !");
  } catch (error) {
    console.error("❌ Erreur lors de la planification des rappels :", error);
  }
};

// 🔥 Mettre à jour les rappels si le médicament est modifié
export const updateMedicationReminders = async (userId, medication) => {
  try {
    const remindersRef = collection(db, "reminders");

    // 📌 Supprimer les anciens rappels
    const q = query(remindersRef, where("idMedication", "==", medication.id));
    const existingReminders = await getDocs(q);
    existingReminders.forEach(async (doc) => {
      await updateDoc(doc.ref, { status: "canceled" });
    });

    // 📌 Programmer les nouveaux rappels
    await scheduleMedicationReminders(userId, medication);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des rappels :", error);
  }
};
