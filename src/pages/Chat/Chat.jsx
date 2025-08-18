import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ✅ Ajout de `useNavigate()`
import { MessageSquare } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { ContactList } from "../../components/chat/ContactList";
import { ChatInterface } from "../../components/chat/ChatInterface";
import { getAuthorizedPatients } from "../../services/doctorServices";
import { getAuthorizedDoctors } from "../../services/patientServices";
import { getUserProfile } from "../../services/profileService";
import { 
  getConversationsByDoctor, 
  getConversationsByPatient, 
  getUnreadMessagesByUser, 
  markMessagesAsRead,
  sendMessage
} from "../../services/chatService";
import PropTypes from "prop-types";

export const Chat = ({ setUnreadChatCount }) => { // 🔥 Ajout de la prop
  const { user } = useContext(AuthContext);
  const { contactId } = useParams(); // ✅ Récupération de l'ID depuis l'URL
  const navigate = useNavigate(); // ✅ Permet de naviguer dynamiquement

  const [contacts, setContacts] = useState([]); // ✅ Liste des contacts (patients ou médecins)
  const [dataUser, setDataUser] = useState(null); // ✅ Informations de l'utilisateur connecté
  const [unreadMessages, setUnreadMessages] = useState({}); // ✅ Messages non lus
  const [selectedContact, setSelectedContact] = useState(null); // ✅ Contact sélectionné
  const [messages, setMessages] = useState([]); // ✅ Liste des messages de la conversation
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState({});

  useEffect(() => {
    fetchConversations();
    fetchUnreadChatCount();
  }, [contactId]); // ✅ Surveille `contactId` pour recharger les conversations si l’URL change

  const fetchConversations = async () => {
    try {
      if (!user) return;

      let contactsData = user.userType === "doctor"
        ? await getAuthorizedPatients(user.uid) 
        : await getAuthorizedDoctors(user.uid);

      const userData = await getUserProfile(user.uid);
      if (userData) {
        setDataUser({ ...userData, id: user.uid });
      }

      setContacts(contactsData);

      if (contactId) {
        const contactFromNotif = contactsData.find(c => String(c.id) === String(contactId));
        if (contactFromNotif) {
          setSelectedContact(contactFromNotif);
          handleStatusConversationReceived(contactFromNotif);
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des conversations :", error);
    }
  };

  const fetchUnreadChatCount = async () => {
    try {
      if (!user) return;
      const unreadMessagesData = await getUnreadMessagesByUser(user.uid);
      setUnreadMessages(unreadMessagesData);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des messages non lus :", error);
    }
  };

  const handleContactSelect = async (contact) => {
    setSelectedContact(contact);
    handleStatusConversationReceived(contact);

    if (unreadMessages[contact.id]?.count > 0) {
       await markMessagesAsRead(user.uid, contact.id);
    }

     setUnreadMessages((prevUnreadMessages) => {
       const updatedMessages = { ...prevUnreadMessages };
       delete updatedMessages[contact.id]; 
       return updatedMessages;
    });

     setUnreadChatCount((prevCount) => Math.max(0, prevCount - (unreadMessages[contact.id]?.count || 0)));
    navigate(`/chat/${contact.id}`);
  };

  const handleStatusConversationReceived = async (contact) => {
    if (!user || !contact) return;

    try {
      let conversation = user.userType === "patient"
        ? await getConversationsByPatient(user.uid, contact.id)
        : await getConversationsByDoctor(user.uid, contact.id);

      setMessages(conversation);
      markAllMessagesAsRead(conversation);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des messages :", error);
    }
  };

  const markAllMessagesAsRead = async (conversation) => {
    const unreadMsgs = conversation.filter(msg => msg.status !== "read" && msg.senderId !== user.uid);
  
    if (unreadMsgs.length > 0) {
      try {
        await Promise.all(unreadMsgs.map(async (msg) => {
          await markMessagesAsRead(msg.receiverId, msg.senderId);
        }));
      } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du statut des messages :", error);
      }
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedContact || !content.trim()) return;

    try {
      await sendMessage(user.uid, selectedContact.id, content);
      // Les messages seront mis à jour via l'écoute en temps réel
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du message :", error);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-health-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Messages</h1>
          <p className="text-neutral-600">Communication sécurisée avec vos contacts médicaux</p>
        </div>

        {/* Interface de chat */}
        <div className="card-medical p-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Liste des contacts */}
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

            {/* Interface de chat */}
            <div className="flex-1">
              {selectedContact ? (
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUserId={user.uid}
                  contactInfo={selectedContact}
                  isTyping={isTyping}
                  onlineStatus={onlineStatuses[selectedContact.id] || 'offline'}
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
 