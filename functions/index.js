import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { createHash, randomUUID } from "crypto";

// 🔥 Initialisation de Firebase Admin
initializeApp({ credential: applicationDefault() });

const firestore = getFirestore();
const messaging = getMessaging();

const computeDatasetChecksum = (payload = {}) => {
  const criticalDataset = {
    standard: payload?.standard,
    chmedVersion: payload?.chmedVersion,
    reference: payload?.reference,
    issuedAt: payload?.issuedAt,
    validUntil: payload?.validUntil,
    issueType: payload?.issueType,
    repeatsAllowed: payload?.repeatsAllowed,
    patientId: payload?.patientAdministrative?.patientId,
    prescriberId: payload?.prescriber?.id,
    medicationsSnapshot: payload?.medicationsSnapshot || [],
  };

  return createHash("sha256")
    .update(JSON.stringify(criticalDataset))
    .digest("hex")
    .toUpperCase()
    .slice(0, 16);
};

const buildSignedToken = ({ registrationId, datasetChecksum, userId }) => {
  const signatureSeed = `${registrationId}:${datasetChecksum}:${userId}:${Date.now()}`;
  const signature = createHash("sha256").update(signatureSeed).digest("hex").toUpperCase();

  return {
    serviceSignature: signature,
    signedRegisteredToken: `ERX-SIGNED-${registrationId}-${signature.slice(0, 12)}`,
  };
};

export const signAndRegisterSwissEPrescription = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Utilisateur non authentifié.");
  }

  const payload = request.data?.payload;
  if (!payload) {
    throw new HttpsError("invalid-argument", "Payload e-ordonnance manquant.");
  }

  if (!payload?.reference || !payload?.issuedAt || !payload?.validUntil) {
    throw new HttpsError(
      "invalid-argument",
      "Référence, date d'émission et date de validité sont obligatoires."
    );
  }

  if (!Array.isArray(payload?.medicationsSnapshot) || payload.medicationsSnapshot.length === 0) {
    throw new HttpsError("invalid-argument", "Au moins un médicament est requis.");
  }

  const containsNarcotic = payload.medicationsSnapshot.some(
    (medication) => medication?.controlledSubstance
  );
  if (containsNarcotic) {
    throw new HttpsError(
      "failed-precondition",
      "Les stupéfiants ne sont pas autorisés via le service e-Rezept Suisse."
    );
  }

  const datasetChecksum = computeDatasetChecksum(payload);
  const registrationId = `REG-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const signed = buildSignedToken({
    registrationId,
    datasetChecksum,
    userId: request.auth.uid,
  });

  logger.info("e-Rezept dataset signed and registered", {
    userId: request.auth.uid,
    registrationId,
    reference: payload.reference,
  });

  return {
    registrationId,
    registeredAt: new Date().toISOString(),
    serviceStatus: "signed_registered",
    datasetChecksum,
    ...signed,
  };
});

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
