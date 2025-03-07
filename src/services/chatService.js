// src/services/chatService.js
import { db } from "../providers/firebase";
import { collection, addDoc, query, where, orderBy, getDocs, onSnapshot, writeBatch, doc, updateDoc } from "firebase/firestore";
import { ChatMessage } from "../models/ChatMessage";
import { addNotification } from "./notificationService";

/**
 * Envoie un message entre un patient et un médecin.
 */
export const sendMessage = async (senderId, receiverId, content) => {
  try {
    const message = new ChatMessage({ senderId, receiverId, content, status: "sent" });
    message.validate();
   
    const conversationId = await addDoc(collection(db, "messages"), message.toFirestore());
    
    markMessageAsReceived(conversationId.id);

    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message :", error);
    return false;
  }
};

/**
 * Récupère tous les messages échangés entre un médecin et un patient.
 */
export const getConversationBetween = async (userId1, userId2) => {
  try {
    const q1 = query(
      collection(db, "messages"),
      where("senderId", "==", userId1),
      where("receiverId", "==", userId2)
    );

    const q2 = query(
      collection(db, "messages"),
      where("senderId", "==", userId2),
      where("receiverId", "==", userId1)
    );

    const [sentMessagesSnapshot, receivedMessagesSnapshot] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ]);

    let messages = [];

    sentMessagesSnapshot.forEach((doc) => {
      messages.push(ChatMessage.fromFirestore(doc));
    });

    receivedMessagesSnapshot.forEach((doc) => {
      messages.push(ChatMessage.fromFirestore(doc));
    });

    // Trier les messages par timestamp (ordre chronologique)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return messages;
  } catch (error) {
    console.error("Erreur lors de la récupération des messages :", error);
    return [];
  }
};

/**
 * Récupère toutes les conversations d'un patient avec les médecins qui ont approuvé son suivi.
 */
export const getConversationsByPatient = async (doctorId, patientId) => {
  try {
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", patientId),
      where("senderId", "==", doctorId),
      orderBy("timestamp", "asc")
    );
    const querySnapshot = await getDocs(q);
    
    let messages = [];
    querySnapshot.forEach((doc) => {
      messages.push(ChatMessage.fromFirestore(doc));
    });
    return messages;
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations :", error);
    return {};
  }
};

/**
 * Récupère toutes les conversations d'un médecin avec ses patients.
 */
export const getConversationsByDoctor = async (doctorId, patientId) => {
  try {
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", doctorId),
      where("senderId", "==", patientId),
      orderBy("timestamp", "asc")
    );
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push(ChatMessage.fromFirestore(doc));;
    });
    return messages;
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations :", error);
    return {};
  }
};

/**
 * Marque tous les messages comme lus pour une conversation.
 */
export const markMessagesAsRead = async (receiverId, senderId) => {
  const messagesQuery = query(
      collection(db, "messages"),
      where("receiverId", "==", receiverId),
      where("senderId", "==", senderId),
      where("status", "==", "received")
  );
  const querySnapshot = await getDocs(messagesQuery);
  querySnapshot.forEach(async (docSnapshot) => {
      await updateDoc(docSnapshot.ref, { status: "read" });
  });
};


/**
 * Écoute les nouveaux messages en temps réel pour un utilisateur donné.
 */
export const listenForNewMessages = (senderId, receiverId, callback) => {
  if (!senderId || !receiverId) {
    console.error("senderId ou receiverId est undefined");
    return;
  }
  const q = query(
    collection(db, "messages"),
    where("senderId", "==", senderId),
    where("receiverId", "==", receiverId),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ChatMessage.fromFirestore(doc));
    callback(messages);
  });
};

/**
 * Récupère le nombre de messages non lus pour un utilisateur.
 */
export const getUnreadMessagesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", userId),
      where("status", "==", "received") // Filtrer uniquement les messages non lus
    );

    const querySnapshot = await getDocs(q);

    const unreadMessages = {};

    querySnapshot.forEach((doc) => {
      const message = doc.data();
      if (!unreadMessages[message.senderId]) {
        unreadMessages[message.senderId] = { count: 0, lastMessage: message };
      }
      unreadMessages[message.senderId].count += 1;
    });

    return unreadMessages;
  } catch (error) {
    console.error("Erreur lors de la récupération des messages non lus :", error);
    return {};
  }
};

export const markMessageAsReceived = async (messageId) => {
  const messageRef = doc(db, "messages", messageId);
  await updateDoc(messageRef, { status: "received" });
};