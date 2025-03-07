import { onSchedule } from "firebase-functions/v2/scheduler";
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

  try {
    const remindersSnapshot = await firestore
      .collection("reminders")
      .where("dateTime", "<=", now)
      .where("status", "==", "pending")
      .get();

    for (const doc of remindersSnapshot.docs) {
      const reminder = doc.data();
      const userRef = firestore.collection("users").doc(reminder.idUser);
      const userDoc = await userRef.get();

      if (userDoc.exists && userDoc.data().fcmToken) {
        const token = userDoc.data().fcmToken;
        await sendNotification(token, `🔔 Rappel : ${reminder.title}`, reminder.details);

        // Marquer le rappel comme "envoyé"
        await doc.ref.update({ status: "completed" });
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des rappels :", error);
  }
});

// 📌 Fonction d'envoi de notification
const sendNotification = async (token, title, body) => {
  try {
    await messaging.send({
      token,
      notification: { title, body },
    });
    console.log(`✅ Notification envoyée à ${token} : ${title}`);
  } catch (error) {
    console.error("❌ Erreur d'envoi de notification :", error);
  }
};
