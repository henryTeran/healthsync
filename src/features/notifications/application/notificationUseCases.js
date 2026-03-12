import { getToken, onMessage } from "firebase/messaging";
import { httpsCallable } from "firebase/functions";
import { functions, messaging } from "../../../providers/firebase";
import { logWarn } from "../../../shared/lib/logger";
import {
  createNotification,
  createPrescriptionNotificationRecord,
  findNotificationPreferences,
  findNotificationsByUser,
  findUserById,
  markNotificationAsReadById,
  removeNotificationById,
  saveNotificationPreferences,
  saveUserToken,
  subscribeNotificationsByUser,
} from "../infrastructure/notificationRepository.firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const resolveTargetToken = async (tokenOrUserId) => {
  if (!tokenOrUserId) return null;

  const user = await findUserById(tokenOrUserId);
  if (user?.fcmToken) {
    return user.fcmToken;
  }

  return tokenOrUserId;
};

export const addNotificationUseCase = async (userId, notificationData) => {
  await createNotification(userId, notificationData);
};

export const getNotificationsByUserUseCase = async (userId) => {
  return findNotificationsByUser(userId);
};

export const markNotificationAsReadUseCase = async (notificationId) => {
  await markNotificationAsReadById(notificationId);
};

export const deleteNotificationUseCase = async (notificationId) => {
  await removeNotificationById(notificationId);
};

export const sendNotificationUseCase = async (tokenOrUserId, title, body) => {
  const token = await resolveTargetToken(tokenOrUserId);
  if (!token) return null;

  const sendNotificationFunction = httpsCallable(functions, "sendNotification");
  const result = await sendNotificationFunction({ token, title, body });
  return result.data;
};

export const testCloudFunctionUseCase = async () => {
  const callable = httpsCallable(functions, "scheduleNotifications");
  return callable();
};

export const saveUserFCMTokenUseCase = async (userId) => {
  if (!messaging) return null;
  if (!VAPID_KEY) {
    logWarn("Impossible de générer le token FCM: VAPID key absente", {
      feature: "notifications",
      action: "saveUserFCMTokenUseCase",
      userId,
    });
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
  });

  if (!token) return null;

  await saveUserToken(userId, token);
  return token;
};

export const getNotificationPreferencesUseCase = async (userId) => {
  return findNotificationPreferences(userId);
};

export const setNotificationPreferencesUseCase = async (userId, preferences) => {
  await saveNotificationPreferences(userId, preferences);
};

export const sendMedicationReminderUseCase = async (userId, medication) => {
  const preferences = await findNotificationPreferences(userId);
  if (!preferences?.fcmEnabled) return null;

  const title = "Rappel de médicament 💊";
  const body = `N'oubliez pas de prendre votre ${medication.medicationName} à ${new Date(
    medication.time
  ).toLocaleTimeString()}`;

  return sendNotificationUseCase(userId, title, body);
};

export const scheduleMedicationRemindersUseCase = async (userId, medications) => {
  const scheduleFunction = httpsCallable(functions, "scheduleNotifications");
  await scheduleFunction({ userId, medications });
};

export const sendPrescriptionNotificationUseCase = async (
  patientId,
  prescriptionId
) => {
  const patientData = await findUserById(patientId);
  if (!patientData) return;

  await createPrescriptionNotificationRecord({
    userId: patientId,
    message:
      "Votre médecin vous a envoyé une nouvelle prescription. Cliquez pour voir les détails.",
    type: "prescription",
    prescriptionId,
    read: false,
    createdAt: new Date().toISOString(),
  });

  if (patientData.fcmToken) {
    await sendNotificationUseCase(
      patientData.fcmToken,
      "Nouvelle ordonnance reçue",
      "Votre médecin vous a envoyé une nouvelle prescription. Cliquez pour voir les détails."
    );
  }
};

export const getNotificationsByUserRealtimeUseCase = (userId, callback) => {
  return subscribeNotificationsByUser(userId, callback);
};

export const listenForRemindersUseCase = () => {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    alert(`📢 Rappel Médicament : ${payload.notification.body}`);
  });
};

export const listenForNotificationsUseCase = () => {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    alert(`📢 Notification : ${payload.notification.body}`);
  });
};
