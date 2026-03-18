import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// 🔥 Initialisation de Firebase Admin
initializeApp({ credential: applicationDefault() });

const firestore = getFirestore();
const messaging = getMessaging();

// ✅ Utilisation correcte de onSchedule
export const scheduleNotifications = onSchedule("every 1 hours", async () => {
  const now = new Date();
  now.setMinutes(0, 0, 0); // Arrondir à l'heure exacte
  logger.info("scheduleNotifications started", { triggerTime: now.toISOString() });

  try {
    const remindersSnapshot = await firestore
      .collection("reminders")
      .where("dateTime", "<=", now)
      .where("status", "==", "pending")
      .get();

    logger.info("scheduleNotifications reminders fetched", {
      remindersCount: remindersSnapshot.size,
    });

    for (const doc of remindersSnapshot.docs) {
      const reminder = doc.data();
      const userRef = firestore.collection("users").doc(reminder.userId || reminder.idUser);
      const userDoc = await userRef.get();

      if (userDoc.exists && userDoc.data().fcmToken) {
        const token = userDoc.data().fcmToken;
        await sendNotification(token, `🔔 Rappel : ${reminder.title}`, reminder.details);

        // Marquer le rappel comme "envoyé"
        await doc.ref.update({ status: "completed" });
      }
    }

    logger.info("scheduleNotifications completed", {
      remindersCount: remindersSnapshot.size,
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des rappels", {
      error: error?.message,
      stack: error?.stack,
    });
  }
});

// 📌 Fonction d'envoi de notification
const sendNotification = async (token, title, body) => {
  try {
    await messaging.send({
      token,
      notification: { title, body },
    });
    logger.info("Notification envoyée", {
      title,
      tokenSuffix: token?.slice(-6),
    });
  } catch (error) {
    logger.error("Erreur d'envoi de notification", {
      error: error?.message,
      stack: error?.stack,
      tokenSuffix: token?.slice(-6),
      title,
    });
  }
};
