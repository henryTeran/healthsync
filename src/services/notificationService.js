// src/services/NotificationService.js
import { db } from "../providers/firebase";
import { doc, setDoc, getDocs, updateDoc, deleteDoc, query, where, collection, getDoc, addDoc, onSnapshot } from "firebase/firestore";
import {getMessaging, getToken, onMessage} from "firebase/messaging";
import { messaging} from "../providers/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "../providers/firebase";
import { generateMedicationSchedule } from "./medicationService";
import { getUserProfile } from "./profileService";



export const addNotification = async (userId, notificationData) => {
  try {
    const notificationRef = doc(db, "notifications", `${userId}_${Date.now()}`);
    await setDoc(notificationRef, {
      ...notificationData,
      userId: userId,
      createdAt: new Date().toISOString(),
      read: false,
    });

  } catch (error) {
    console.error("Erreur lors de l'ajout de la notification :", error);
    throw error;
  }
};

export const testCloudFunction = async () => {
  try {
    const testFunction = httpsCallable(functions, "scheduleNotifications");
    const result = await testFunction();
    console.log("🔥 Résultat de la fonction Cloud :", result);
  } catch (error) {
    console.error("❌ Erreur lors de l'appel à la fonction cloud :", error);
  }
};


export const getNotificationsByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications :", error);
    throw error;
  }
};


export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification :", error);
    throw error;
  }
};


export const deleteNotification = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification :", error);
    throw error;
  }
};


export const sendNotification = async (fcmToken, title, body) => {
  try {
    // const userData = await getUserProfile(userId);
    // const fcmToken = userData.fcmToken;

    // if (!fcmToken) {
    //   console.warn("❌ L'utilisateur n'a pas de token FCM.");
    //   return;
    // }

    const sendNotificationFunction = httpsCallable(functions, "sendNotification");

    const result = await sendNotificationFunction({ token: fcmToken, title, body });

    console.log("✅ Réponse de la fonction Cloud :", result.data);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification :", error);
  }
};

export const saveUserFCMToken = async (userId) => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "BFu9HBapS7r3a-b8uYrISGVYJ527629jSQbVlVZUfIddnzT9x7Z1DvfXRcbTBPtFQOYuG5vrS_QXvC_XV9TXzn4",
    });

    if (token) {
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      console.log("Token FCM enregistré :", token);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du token FCM :", error);
  }
};

export const getNotificationPreferences = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, "notifications_preferences", userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences de notification :", error);
    throw error;
  }
};

export const sendMedicationReminder = async (userId, medication) => {
  try {
    const preferences = await getNotificationPreferences(userId);
    if (!preferences || !preferences.fcmEnabled) return;

    const token = await getToken(messaging, { vapidKey: "TON_VAPID_KEY" });

    if (!token) {
      console.error("Aucun token FCM disponible.");
      return;
    }

    const message = {
      to: token,
      notification: {
        title: "Rappel de médicament 💊",
        body: `N'oubliez pas de prendre votre ${medication.medicationName} à ${new Date(medication.time).toLocaleTimeString()}`,
      },
    };

    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=TON_FIREBASE_SERVER_KEY`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    console.log("Notification envoyée :", message);
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification :", error);
  }
};

export const scheduleMedicationReminders = async (userId, medications) => {
  try {
    // Appel de la Cloud Function "scheduleNotifications"
    const scheduleFunction = httpsCallable(functions, "scheduleNotifications");
    await scheduleFunction({ userId, medications });

    console.log("✅ Rappels de médicaments programmés !");
  } catch (error) {
    console.error("❌ Erreur lors de la planification des rappels :", error);
  }
};


const handleAccept = async () => {
  if (!startDate) {
    alert("Veuillez sélectionner une date de début.");
    return;
  }
  await acceptPrescription(prescriptionId);
  await setMedicationStartDate(prescriptionId, startDate);

  // Récupération des médicaments liés à la prescription
  const medications = await getMedicationsByPrescription(prescriptionId);

  // Planifier les rappels
  await scheduleMedicationReminders(user.uid, medications, startDate);

  alert("Prescription acceptée et notifications programmées !");
  onConfirmed();
};


export const sendPrescriptionNotification = async (patientId, prescriptionId) => {
  try {
    // Vérifier si le patient a un token FCM enregistré
    // const q = query(collection(db, "users"), where("id", "==", patientId));
    // const querySnapshot = await getDocs(q);
    // debugger
    // if (querySnapshot.empty) {
    //   console.warn("Aucun utilisateur trouvé avec cet ID.");
    //   return;
    // }

    // const userDoc = querySnapshot.docs[0];
    // const patientData = userDoc.data();
    const patientData = await getUserProfile(patientId);
    const fcmToken = patientData.fcmToken;  

    if (!fcmToken) {
      console.warn("Le patient n'a pas de token FCM enregistré.");
      return;
    }

    // Construire le message de la notification
    const message = {
      token: fcmToken,
      notification: {
        title: "Nouvelle ordonnance reçue",
        body: "Votre médecin vous a envoyé une nouvelle prescription. Cliquez pour voir les détails.",
      },
      data: {
        prescriptionId: prescriptionId, // Permet de rediriger vers l'ordonnance
      },
    };

    // Enregistrer la notification dans Firestore
    await addDoc(collection(db, "notifications"), {
      userId: patientId,
      message: message.notification.body,
      type: "prescription",
      prescriptionId: prescriptionId,
      read: false,
      createdAt: new Date().toISOString(),
    });

    console.log("✅ Notification de prescription envoyée !");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification :", error);
  }
};



// 🔹 Écoute des notifications push
export const listenForReminders = () => {
  const messaging = getMessaging();

  onMessage(messaging, (payload) => {
    console.log("🔔 Rappel reçu :", payload);
    alert(`📢 Rappel Médicament : ${payload.notification.body}`);
  });
};

export const sendPrescriptionNotificationFCM = async (patientId, prescriptionId) => {
  try {
    const patientData = await getUserProfile(patientId);
    if (!patientData || !patientData.fcmToken) {
      console.warn("❌ Le patient n'a pas de token FCM enregistré.");
      return;
    }

    const fcmToken = patientData.fcmToken;

    const message = {
      token: fcmToken,
      notification: {
        title: "📄 Nouvelle ordonnance reçue",
        body: "Votre médecin vous a envoyé une prescription. Cliquez pour voir les détails.",
      },
      data: {
        prescriptionId: prescriptionId, // Permet de rediriger vers l'ordonnance
      },
    };

    // 🔥 Envoi via Firebase Admin SDK
    await admin.messaging().send(message);
    console.log("✅ Notification FCM envoyée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification FCM :", error);
  }
};

export const getNotificationsByUserRealtime = (userId, callback) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(notifications);
  });
};




export const listenForNotifications = () => {
  onMessage(messaging, (payload) => {
    console.log("🔔 Nouvelle notification reçue :", payload);
    alert(`📢 Notification : ${payload.notification.body}`);
  });
};