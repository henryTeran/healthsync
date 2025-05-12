import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ✅ Ajout de `useNavigate()`
import { AuthContext } from "../../contexts/AuthContext";
import { getAuthorizedPatients } from "../../services/doctorServices";
import { getAuthorizedDoctors } from "../../services/patientServices";
import { getUserProfile } from "../../services/profileService";
import { ChatComponent } from "../../components/ChatComponent";
import { UserCircle } from "lucide-react";
import { getConversationsByDoctor, getConversationsByPatient, getUnreadMessagesByUser, markMessagesAsRead } from "../../services/chatService";
import PropTypes from "prop-types";


export const Chat = ({ setUnreadChatCount }) => { // 🔥 Ajout de la prop
  const { user } = useContext(AuthContext);
  const { contactId } = useParams(); // ✅ Récupération de l'ID depuis l'URL
  const navigate = useNavigate(); // ✅ Permet de naviguer dynamiquement
  console.log("🆔 Contact ID depuis l'URL :", contactId);

  const [contacts, setContacts] = useState([]); // ✅ Liste des contacts (patients ou médecins)
  const [dataUser, setDataUser] = useState(null); // ✅ Informations de l'utilisateur connecté
  const [unreadMessages, setUnreadMessages] = useState({}); // ✅ Messages non lus
  const [selectedContact, setSelectedContact] = useState(null); // ✅ Contact sélectionné
  const [messages, setMessages] = useState([]); // ✅ Liste des messages de la conversation


  useEffect(() => {
    console.log("🆔 Contact ID détecté :", contactId);
    fetchConversations();
    fetchUnreadChatCount();
  }, [contactId]); // ✅ Surveille `contactId` pour recharger les conversations si l’URL change

  // 🔹 Fonction pour récupérer les contacts et le profil utilisateur
  const fetchConversations = async () => {
    try {
      if (!user) return;

      let contactsData = user.userType === "doctor"
        ? await getAuthorizedPatients(user.uid) 
        : await getAuthorizedDoctors(user.uid);

      console.log("📌 Contacts récupérés :", contactsData);

      const userData = await getUserProfile(user.uid);
      if (userData) {
        setDataUser({ ...userData, id: user.uid });
      } else {
        console.warn("⚠️ Aucun profil utilisateur trouvé pour l'ID :", user.uid);
      }

      setContacts(contactsData);

      // 🔹 Si `contactId` est défini, sélectionne automatiquement le contact
      if (contactId) {
        const contactFromNotif = contactsData.find(c => String(c.id) === String(contactId));
        if (contactFromNotif) {
          console.log("✅ Contact trouvé :", contactFromNotif);
          setSelectedContact(contactFromNotif);
          handleStatusConversationReceived(contactFromNotif);
        } else {
          console.warn("⚠️ Aucun contact trouvé avec cet ID :", contactId);
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des conversations :", error);
    }
  };

  // 🔹 Récupération des messages non lus
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

    // 🔥 Supprime uniquement les messages non lus du contact sélectionné
    setUnreadMessages((prevUnreadMessages) => {
        const updatedMessages = { ...prevUnreadMessages };
        delete updatedMessages[contact.id]; 
        return updatedMessages;
    });

    // 🔹 Met à jour le total des messages non lus
    setUnreadChatCount((prevCount) => Math.max(0, prevCount - (unreadMessages[contact.id]?.count || 0)));
    navigate(`/chat/${contact.id}`);
};

  // 🔹 Charger les messages du contact sélectionné et les marquer comme lus
  const handleStatusConversationReceived = async (contact) => {
    if (!user || !contact) return;

    try {
      let conversation = user.userType === "patient"
        ? await getConversationsByPatient(user.uid, contact.id)
        : await getConversationsByDoctor(user.uid, contact.id);

      console.log("💬 Messages récupérés :", conversation);
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

  return (
    <div className="flex h-full">
      {/* Liste des contacts */}
      <div className="bg-gray-100 w-1/4 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {user.userType === "doctor" ? "Patients suivis" : "Médecins disponibles"}
        </h2>
        
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={`flex items-center justify-between py-2 cursor-pointer hover:bg-gray-200 rounded ${
              contactId === String(contact.id) ? "bg-green-300" : ""
            }`}
            onClick={() => handleContactSelect(contact)}
          >
            <div className="flex items-center space-x-2">
              <UserCircle className="w-8 h-8 text-gray-500" />
              <span>{user.userType === "doctor" ? `${contact.firstName} ${contact.lastName}` : `Dr. ${contact.firstName} ${contact.lastName}`}</span>
            </div>

            {/* Badge des messages non lus */}
            {unreadMessages[contact.id]?.count > 0 && (
              <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                {unreadMessages[contact.id].count}
              </span>
            )}
          </div>
        ))}

        {/* Afficher un message si aucun contact disponible */}
        {contacts.length === 0 && <p className="text-center text-gray-500">Aucun contact disponible.</p>}
      </div>

      {/* Zone de chat */}
      <div className="flex-1 bg-white p-4 overflow-y-auto">
        {selectedContact ? (
          <ChatComponent selectedContact={selectedContact} userType={user.userType} currentUserId={user.uid} />
        ) : (
          <p className="text-center text-gray-500">Sélectionnez un contact pour commencer à discuter.</p>
        )}
      </div>
    </div>
  );
};

Chat.propTypes = {
  setUnreadChatCount: PropTypes.func.isRequired,
};
 