import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";
import { logError } from "../../../shared/lib/logger";

const remindersCollection = collection(db, "reminders");
const medicationsCollection = collection(db, "medications");

export const createReminderRecord = async (payload) => {
  const docRef = await addDoc(remindersCollection, payload);
  return docRef.id;
};

export const subscribeRemindersByUser = (userId, callback) => {
  const remindersQuery = query(remindersCollection, where("userId", "==", userId));

  return onSnapshot(
    remindersQuery,
    (snapshot) => {
      const reminders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      callback(reminders);
    },
    (error) => {
      logError("Erreur realtime rappels", error, {
        feature: "reminders",
        action: "subscribeRemindersByUser",
        userId,
      });
    }
  );
};

export const updateReminderRecord = async (reminderId, payload) => {
  await updateDoc(doc(db, "reminders", reminderId), payload);
};

export const deleteReminderRecord = async (reminderId) => {
  await deleteDoc(doc(db, "reminders", reminderId));
};

export const findMedicationReminders = async (medicationId) => {
  const reminderQuery = query(remindersCollection, where("idMedication", "==", medicationId));
  return getDocs(reminderQuery);
};

export const findMedicationsByPrescription = async (prescriptionId) => {
  const medicationQuery = query(
    medicationsCollection,
    where("idPrescription", "==", prescriptionId)
  );
  return getDocs(medicationQuery);
};

export const updateMedicationRecord = async (medicationId, payload) => {
  await updateDoc(doc(db, "medications", medicationId), payload);
};
