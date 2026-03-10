import { ChatMessage } from "../../../models/ChatMessage";
import {
  createMessage,
  findConversationBetween,
  findConversationsByDoctor,
  findConversationsByPatient,
  findUnreadMessagesByUser,
  markMessageAsReceivedById,
  markMessagesAsReadByParticipants,
  subscribeMessages,
} from "../infrastructure/chatRepository.firebase";

const toChatMessage = (message) => new ChatMessage({ id: message.id, ...message });

export const sendMessageUseCase = async (senderId, receiverId, content) => {
  const message = new ChatMessage({ senderId, receiverId, content, status: "sent" });
  message.validate();

  const created = await createMessage(message.toFirestore());
  await markMessageAsReceivedById(created.id);

  return true;
};

export const getConversationBetweenUseCase = async (userId1, userId2) => {
  const messages = await findConversationBetween(userId1, userId2);
  return messages.map(toChatMessage);
};

export const getConversationsByPatientUseCase = async (doctorId, patientId) => {
  const messages = await findConversationsByPatient(doctorId, patientId);
  return messages.map(toChatMessage);
};

export const getConversationsByDoctorUseCase = async (doctorId, patientId) => {
  const messages = await findConversationsByDoctor(doctorId, patientId);
  return messages.map(toChatMessage);
};

export const markMessagesAsReadUseCase = async (receiverId, senderId) => {
  await markMessagesAsReadByParticipants(receiverId, senderId);
};

export const listenForNewMessagesUseCase = (senderId, receiverId, callback) => {
  if (!senderId || !receiverId) {
    throw new Error("senderId ou receiverId est undefined");
  }

  return subscribeMessages(senderId, receiverId, (messages) => {
    callback(messages.map(toChatMessage));
  });
};

export const getUnreadMessagesByUserUseCase = async (userId) => {
  return findUnreadMessagesByUser(userId);
};

export const markMessageAsReceivedUseCase = async (messageId) => {
  await markMessageAsReceivedById(messageId);
};
