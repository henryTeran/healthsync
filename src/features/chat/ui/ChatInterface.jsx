import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Archive,
  Check,
  CheckCheck,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Star,
  Video,
} from "lucide-react";

export const ChatInterface = ({
  messages = [],
  onSendMessage,
  currentUserId,
  contactInfo,
  isTyping = false,
  onlineStatus = "offline",
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") return;

    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  };

  const getMessageStatus = (message) => {
    if (message.senderId !== currentUserId) return null;

    switch (message.status) {
      case "sent":
        return <Check className="h-3 w-3 text-neutral-400" />;
      case "received":
        return <CheckCheck className="h-3 w-3 text-neutral-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-medical-500" />;
      default:
        return null;
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        return date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getOnlineStatusColor = () => {
    switch (onlineStatus) {
      case "online":
        return "bg-health-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-neutral-400";
    }
  };

  const getOnlineStatusText = () => {
    switch (onlineStatus) {
      case "online":
        return "En ligne";
      case "away":
        return "Absent";
      default:
        return "Hors ligne";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
      <div className="bg-gradient-to-r from-medical-500 to-medical-600 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {contactInfo?.firstName?.[0]}
                {contactInfo?.lastName?.[0]}
              </span>
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 ${getOnlineStatusColor()} border-2 border-white rounded-full`}
            ></div>
          </div>
          <div className="text-white">
            <h3 className="font-semibold">
              {contactInfo?.type === "doctor" ? "Dr. " : ""}
              {contactInfo?.firstName} {contactInfo?.lastName}
            </h3>
            <p className="text-sm text-medical-100">{getOnlineStatusText()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <Video className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowContactMenu(!showContactMenu)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

            return (
              <div key={index} className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}>
                <div
                  className={`flex items-end space-x-2 max-w-[70%] ${
                    isOwn ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  {!isOwn && showAvatar && (
                    <div className="w-8 h-8 bg-gradient-to-br from-medical-400 to-medical-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {contactInfo?.firstName?.[0]}
                      </span>
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8"></div>}

                  <div
                    className={`relative px-4 py-3 rounded-2xl shadow-soft ${
                      isOwn
                        ? "bg-gradient-to-br from-medical-500 to-medical-600 text-white"
                        : "bg-white border border-neutral-200 text-neutral-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    <div
                      className={`flex items-center justify-end space-x-1 mt-2 ${
                        isOwn ? "text-medical-100" : "text-neutral-400"
                      }`}
                    >
                      <span className="text-xs">{formatMessageTime(message.timestamp)}</span>
                      {getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-600 mb-2">Aucun message</h3>
              <p className="text-sm text-neutral-500">
                Commencez la conversation en envoyant un message
              </p>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-medical-400 to-medical-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{contactInfo?.firstName?.[0]}</span>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-neutral-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              rows="1"
              className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-200"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />

            <div className="absolute right-2 bottom-2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-neutral-400 hover:text-medical-600 transition-colors rounded-lg hover:bg-medical-50"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-2 text-neutral-400 hover:text-medical-600 transition-colors rounded-lg hover:bg-medical-50"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {showContactMenu && (
        <div className="absolute top-16 right-4 w-48 card-medical animate-slide-down z-50">
          <button className="w-full px-4 py-3 text-left hover:bg-medical-50 transition-colors flex items-center space-x-2">
            <Search className="h-4 w-4 text-medical-500" />
            <span>Rechercher dans la conversation</span>
          </button>
          <button className="w-full px-4 py-3 text-left hover:bg-medical-50 transition-colors flex items-center space-x-2">
            <Star className="h-4 w-4 text-medical-500" />
            <span>Marquer comme favori</span>
          </button>
          <button className="w-full px-4 py-3 text-left hover:bg-medical-50 transition-colors flex items-center space-x-2">
            <Archive className="h-4 w-4 text-medical-500" />
            <span>Archiver la conversation</span>
          </button>
        </div>
      )}
    </div>
  );
};

ChatInterface.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      senderId: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      status: PropTypes.oneOf(["sent", "received", "read"]),
    })
  ),
  onSendMessage: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired,
  contactInfo: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    type: PropTypes.string,
  }),
  isTyping: PropTypes.bool,
  onlineStatus: PropTypes.oneOf(["online", "away", "offline"]),
};
