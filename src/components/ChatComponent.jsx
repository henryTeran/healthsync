import React, { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  listenForNewMessages,
  getConversationBetween
} from "../services/chatService";
import PropTypes from "prop-types";
import { Send } from "lucide-react";
import { useParams } from "react-router-dom";

export const ChatComponent = ({ selectedContact, userType, currentUserId }) => {
  const { contactId } = useParams(); // ✅ Récupère l'ID du contact depuis l'URL
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  console.log("🔹 Contact sélectionné :", selectedContact.id);
  console.log("🔹 Contact ID depuis URL :", contactId);

  useEffect(() => {
    if (!contactId || !selectedContact.id) {
      console.warn("⚠️ Aucune conversation trouvée pour l'ID :", contactId);
      return;
    }

    console.log("✅ Chargement des messages pour le contact :", selectedContact);
    loadMessages();
    
    // ✅ Écoute en temps réel des nouveaux messages
    const unsubscribeFunction = listenForNewMessages(
      currentUserId,
      contactId,
      currentUserId,
      (newMessages) => {
        console.log("💬 Nouveaux messages reçus :", newMessages);
        setMessages(newMessages);
      }
    );

    return () => {
      unsubscribeFunction?.(); // Nettoyage de l'écoute en temps réel
    };
  }, [contactId, selectedContact]);

  // ✅ Charge les messages de la conversation entre l'utilisateur et le contact sélectionné
  const loadMessages = async () => {
    if (!selectedContact) return;
  
    try {
      console.log("📥 Chargement des messages...");
      const conversation = await getConversationBetween(currentUserId, contactId);
      setMessages(conversation);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des messages :", error);
    }
  };

  // ✅ Envoi d'un message
  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;
  
    const newMessageData = {
      senderId: currentUserId,
      receiverId: contactId,
      content: newMessage.trim(),
      timestamp: Date.now(),
      status: "sent",
    };
  
    setMessages((prevMessages) => [...prevMessages, newMessageData]); // ✅ Mise à jour immédiate du chat
  
    await sendMessage(newMessageData.senderId, newMessageData.receiverId, newMessageData.content);
    setNewMessage(""); // ✅ Réinitialisation de l'input
  };

  // ✅ Scroll automatique vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-white shadow-lg rounded-2xl flex flex-col h-[400px]">
      <div className="bg-blue-500 text-white p-3 font-semibold rounded-t-2xl">
        {selectedContact
          ? userType === "doctor"
            ? `Chat avec ${selectedContact.firstName} ${selectedContact.lastName}`
            : `Chat avec Dr. ${selectedContact.firstName} ${selectedContact.lastName}`
          : "Sélectionnez un contact"}
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-2 rounded-lg max-w-[70%] ${
                  msg.senderId === currentUserId ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {msg.content}
              </div>
              <div className="text-xs text-gray-500"> 
                {msg.senderId === currentUserId && msg.status === "sent" && "✓ Envoyé"}
                {msg.senderId === currentUserId && msg.status === "received" && "✓✓ Reçu"}
                {msg.senderId === currentUserId && msg.status === "read" && "✓✓ Lu"}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">Aucun message dans cette conversation.</p>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input */}
      <div className="flex items-center border-t p-3">
        <input
          type="text"
          className="flex-1 p-2 border rounded-lg focus:outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message..."
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 bg-blue-500 text-white px-3 py-3 rounded-full hover:bg-blue-600"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

ChatComponent.propTypes = {
  selectedContact: PropTypes.shape({
    id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
  }),
  userType: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
};
