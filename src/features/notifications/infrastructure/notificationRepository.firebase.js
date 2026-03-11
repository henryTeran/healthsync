import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";
import { logError } from "../../../shared/lib/logger";

const notificationsCollection = collection(db, "notifications");

export const createNotification = async (userId, notificationData) => {
  const notificationRef = doc(db, "notifications", `${userId}_${Date.now()}`);
  await setDoc(notificationRef, {
    ...notificationData,
    userId,
    createdAt: new Date().toISOString(),
    read: false,
  });
};

export const createPrescriptionNotificationRecord = async (payload) => {
  await addDoc(notificationsCollection, payload);
};

export const findNotificationsByUser = async (userId) => {
  const notificationsQuery = query(
    notificationsCollection,
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(notificationsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const markNotificationAsReadById = async (notificationId) => {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
};

export const removeNotificationById = async (notificationId) => {
  await deleteDoc(doc(db, "notifications", notificationId));
};

export const subscribeNotificationsByUser = (userId, callback) => {
  const notificationsQuery = query(
    notificationsCollection,
    where("userId", "==", userId)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      callback(notifications);
    },
    (error) => {
      logError("Erreur realtime notifications", error, {
        feature: "notifications",
        action: "subscribeNotificationsByUser",
        userId,
      });
    }
  );
};

export const saveUserToken = async (userId, token) => {
  await setDoc(doc(db, "users", userId), { fcmToken: token }, { merge: true });
};

export const findUserById = async (userId) => {
  const snapshot = await getDoc(doc(db, "users", userId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

export const findNotificationPreferences = async (userId) => {
  const snapshot = await getDoc(doc(db, "notifications_preferences", userId));
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveNotificationPreferences = async (userId, preferences) => {
  await setDoc(doc(db, "notifications_preferences", userId), preferences, {
    merge: true,
  });
};
