import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { MessageSquare } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { getAuthorizedPatients, getAuthorizedDoctors } from "../../../features/profile";
import { getUserProfile } from "../../../features/profile";
import {
  getConversationsByDoctorUseCase,
  getConversationsByPatientUseCase,
  getUnreadMessagesByUserUseCase,
  markMessagesAsReadUseCase,
  sendMessageUseCase,
} from "..";
import { ChatInterface } from "./ChatInterface";
import { ContactList } from "./ContactList";
import { logError } from "../../../shared/lib/logger";

export const Chat = ({ setUnreadChatCount }) => {
  const { user } = useContext(AuthContext);
  const { contactId } = useParams();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [, setDataUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping] = useState(false);
  const [onlineStatuses] = useState({});

  useEffect(() => {
    fetchConversations();
    fetchUnreadChatCount();
  }, [contactId]);

  const fetchConversations = async () => {
    try {
      if (!user) return;

      const contactsData =
        user.userType === "doctor"
          ? await getAuthorizedPatients(user.uid)
          : await getAuthorizedDoctors(user.uid);

      const userData = await getUserProfile(user.uid);
      if (userData) {
        setDataUser({ ...userData, id: user.uid });
      }

      setContacts(contactsData);

      if (contactId) {
        const contactFromNotif = contactsData.find(
          (contact) => String(contact.id) === String(contactId)
        );

        if (contactFromNotif) {
          setSelectedContact(contactFromNotif);
          handleStatusConversationReceived(contactFromNotif);
        }
      }
    } catch (error) {
      logError("Erreur lors de la récupération des conversations", error, {
        feature: "chat",
        action: "fetchConversations",
        userId: user?.uid,
      });
    }
  };

  const fetchUnreadChatCount = async () => {
    try {
      if (!user) return;

      const unreadMessagesData = await getUnreadMessagesByUserUseCase(user.uid);
      setUnreadMessages(unreadMessagesData);
    } catch (error) {
      logError("Erreur lors de la récupération des messages non lus", error, {
        feature: "chat",
        action: "fetchUnreadChatCount",
        userId: user?.uid,
      });
    }
  };

  const handleContactSelect = async (contact) => {
    setSelectedContact(contact);
    handleStatusConversationReceived(contact);

    if (unreadMessages[contact.id]?.count > 0) {
      await markMessagesAsReadUseCase(user.uid, contact.id);
    }

    setUnreadMessages((previousUnreadMessages) => {
      const updatedMessages = { ...previousUnreadMessages };
      delete updatedMessages[contact.id];
      return updatedMessages;
    });

    setUnreadChatCount((previousCount) =>
      Math.max(0, previousCount - (unreadMessages[contact.id]?.count || 0))
    );
    navigate(`/chat/${contact.id}`);
  };

  const handleStatusConversationReceived = async (contact) => {
    if (!user || !contact) return;

    try {
      const conversation =
        user.userType === "patient"
          ? await getConversationsByPatientUseCase(user.uid, contact.id)
          : await getConversationsByDoctorUseCase(user.uid, contact.id);

      setMessages(conversation);
      markAllMessagesAsRead(conversation);
    } catch (error) {
      logError("Erreur lors du chargement des messages", error, {
        feature: "chat",
        action: "handleStatusConversationReceived",
        userId: user?.uid,
        contactId: contact?.id,
      });
    }
  };

  const markAllMessagesAsRead = async (conversation) => {
    const unreadMessagesList = conversation.filter(
      (message) => message.status !== "read" && message.senderId !== user.uid
    );

    if (unreadMessagesList.length > 0) {
      try {
        await Promise.all(
          unreadMessagesList.map(async (message) => {
            await markMessagesAsReadUseCase(message.receiverId, message.senderId);
          })
        );
      } catch (error) {
        logError("Erreur lors de la mise à jour du statut des messages", error, {
          feature: "chat",
          action: "markAllMessagesAsRead",
          userId: user?.uid,
        });
      }
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedContact || !content.trim()) return;

    try {
      await sendMessageUseCase(user.uid, selectedContact.id, content);
    } catch (error) {
      logError("Erreur lors de l'envoi du message", error, {
        feature: "chat",
        action: "handleSendMessage",
        userId: user?.uid,
        contactId: selectedContact?.id,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Messages</h1>
          <p className="text-neutral-600">Communication sécurisée avec vos contacts médicaux</p>
        </div>

        <div className="card-medical p-0 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          <div className="flex h-full">
            <div className="w-1/3 border-r border-neutral-200">
              <ContactList
                contacts={contacts}
                selectedContactId={selectedContact?.id}
                onContactSelect={handleContactSelect}
                unreadMessages={unreadMessages}
                userType={user.userType}
                onlineStatuses={onlineStatuses}
              />
            </div>

            <div className="flex-1">
              {selectedContact ? (
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUserId={user.uid}
                  contactInfo={selectedContact}
                  isTyping={isTyping}
                  onlineStatus={onlineStatuses[selectedContact.id] || "offline"}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-10 w-10 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                      Sélectionnez une conversation
                    </h3>
                    <p className="text-neutral-500">
                      Choisissez un contact pour commencer à discuter
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Chat.propTypes = {
  setUnreadChatCount: PropTypes.func.isRequired,
};
