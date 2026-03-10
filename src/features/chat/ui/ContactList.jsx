import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Search,
  UserCircle,
  Stethoscope,
  MessageSquare,
  Star,
  Filter,
} from "lucide-react";

export const ContactList = ({
  contacts = [],
  selectedContactId,
  onContactSelect,
  unreadMessages = {},
  userType,
  onlineStatuses = {},
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = `${contact.firstName} ${contact.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "unread":
        return unreadMessages[contact.id]?.count > 0;
      case "favorites":
        return contact.isFavorite;
      default:
        return true;
    }
  });

  const getContactTitle = (contact) => {
    if (userType === "doctor") {
      return `${contact.firstName} ${contact.lastName}`;
    }

    return `Dr. ${contact.firstName} ${contact.lastName}`;
  };

  const getOnlineStatusColor = (contactId) => {
    const status = onlineStatuses[contactId] || "offline";
    switch (status) {
      case "online":
        return "bg-health-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-neutral-400";
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (diffDays === 1) {
        return "Hier";
      }

      if (diffDays < 7) {
        return `${diffDays}j`;
      }

      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-neutral-200">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">
            {userType === "doctor" ? "Patients" : "Médecins"}
          </h2>
          <button className="p-2 text-neutral-400 hover:text-medical-600 transition-colors rounded-lg hover:bg-medical-50">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex space-x-2 mt-3">
          {[
            { key: "all", label: "Tous", icon: MessageSquare },
            { key: "unread", label: "Non lus", icon: MessageSquare },
            { key: "favorites", label: "Favoris", icon: Star },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? "bg-medical-100 text-medical-700"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-3 w-3 inline mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => {
            const isSelected = selectedContactId === contact.id;
            const unreadCount = unreadMessages[contact.id]?.count || 0;
            const lastMessage = unreadMessages[contact.id]?.lastMessage;

            return (
              <button
                key={contact.id}
                onClick={() => onContactSelect(contact)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-medical-50 transition-all duration-200 border-l-4 ${
                  isSelected ? "bg-medical-50 border-medical-500" : "border-transparent"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      contact.type === "doctor"
                        ? "bg-gradient-to-br from-medical-400 to-medical-500"
                        : "bg-gradient-to-br from-health-400 to-health-500"
                    }`}
                  >
                    {contact.type === "doctor" ? (
                      <Stethoscope className="h-6 w-6 text-white" />
                    ) : (
                      <UserCircle className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 ${getOnlineStatusColor(contact.id)} border-2 border-white rounded-full`}
                  ></div>
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-800 truncate">
                      {getContactTitle(contact)}
                    </h4>
                    {lastMessage && (
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {formatLastMessageTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  {contact.department && (
                    <p className="text-xs text-neutral-500 truncate">{contact.department}</p>
                  )}

                  {lastMessage && (
                    <p className="text-sm text-neutral-600 truncate mt-1">{lastMessage.content}</p>
                  )}
                </div>

                {unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <UserCircle className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">
                {searchTerm ? "Aucun contact trouvé" : "Aucun contact disponible"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ContactList.propTypes = {
  contacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      type: PropTypes.string,
      department: PropTypes.string,
      isFavorite: PropTypes.bool,
    })
  ),
  selectedContactId: PropTypes.string,
  onContactSelect: PropTypes.func.isRequired,
  unreadMessages: PropTypes.object,
  userType: PropTypes.oneOf(["doctor", "patient"]).isRequired,
  onlineStatuses: PropTypes.object,
};
