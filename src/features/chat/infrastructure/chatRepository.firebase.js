import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";

const messagesCollection = collection(db, "messages");

const mapMessages = (snapshot) =>
  snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

export const createMessage = async (payload) => {
  return addDoc(messagesCollection, payload);
};

export const findConversationBetween = async (userId1, userId2) => {
  const q1 = query(
    messagesCollection,
    where("senderId", "==", userId1),
    where("receiverId", "==", userId2)
  );

  const q2 = query(
    messagesCollection,
    where("senderId", "==", userId2),
    where("receiverId", "==", userId1)
  );

  const [sentSnapshot, receivedSnapshot] = await Promise.all([
    getDocs(q1),
    getDocs(q2),
  ]);

  const messages = [...mapMessages(sentSnapshot), ...mapMessages(receivedSnapshot)];
  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return messages;
};

export const findConversationsByPatient = async (doctorId, patientId) => {
  const q = query(
    messagesCollection,
    where("receiverId", "==", patientId),
    where("senderId", "==", doctorId),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  return mapMessages(snapshot);
};

export const findConversationsByDoctor = async (doctorId, patientId) => {
  const q = query(
    messagesCollection,
    where("receiverId", "==", doctorId),
    where("senderId", "==", patientId),
    orderBy("timestamp", "asc")
  );

  const snapshot = await getDocs(q);
  return mapMessages(snapshot);
};

export const markMessagesAsReadByParticipants = async (receiverId, senderId) => {
  const messagesQuery = query(
    messagesCollection,
    where("receiverId", "==", receiverId),
    where("senderId", "==", senderId),
    where("status", "==", "received")
  );

  const snapshot = await getDocs(messagesQuery);
  await Promise.all(snapshot.docs.map((item) => updateDoc(item.ref, { status: "read" })));
};

export const subscribeMessages = (senderId, receiverId, callback) => {
  const messagesQuery = query(
    messagesCollection,
    where("senderId", "==", senderId),
    where("receiverId", "==", receiverId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    callback(mapMessages(snapshot));
  });
};

export const findUnreadMessagesByUser = async (userId) => {
  const messagesQuery = query(
    messagesCollection,
    where("receiverId", "==", userId),
    where("status", "==", "received")
  );

  const snapshot = await getDocs(messagesQuery);
  const unreadMessages = {};

  snapshot.forEach((item) => {
    const message = item.data();

    if (!unreadMessages[message.senderId]) {
      unreadMessages[message.senderId] = { count: 0, lastMessage: message };
    }

    unreadMessages[message.senderId].count += 1;
  });

  return unreadMessages;
};

export const markMessageAsReceivedById = async (messageId) => {
  await updateDoc(doc(db, "messages", messageId), { status: "received" });
};
