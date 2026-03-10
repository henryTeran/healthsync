import { useContext, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import {
  getNotificationsByUserRealtime,
  markNotificationAsRead,
} from "../../../features/notifications";

export const NotificationWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useContext(AuthContext);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return () => {};

    const unsubscribe = getNotificationsByUserRealtime(user.uid, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter((item) => !item.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    }

    if (
      notification.type === "new_appointment_request" ||
      notification.type === "reponse_appointment_request"
    ) {
      navigate("/appointments");
    } else if (notification.type === "chat") {
      navigate(`/chat/${notification.senderId}`);
    } else if (notification.type === "prescription") {
      navigate(`/medications/prescription/${notification.prescriptionId}`);
    }

    setShowPopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="relative btn-ghost p-3 rounded-xl hover-lift"
      >
        <Bell className="h-5 w-5 text-medical-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-soft animate-pulse-soft">
            {unreadCount}
          </span>
        )}
      </button>

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute right-0 mt-3 w-80 card-medical animate-slide-down z-[99999]"
          style={{ zIndex: 99999 }}
        >
          <div className="px-6 py-4 border-b border-medical-100">
            <h3 className="font-semibold text-medical-800">Notifications</h3>
          </div>
          {notifications.length > 0 ? (
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-6 py-4 border-b border-medical-50 last:border-b-0 cursor-pointer hover:bg-medical-50 transition-colors duration-200 ${
                    notification.read ? "opacity-60" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        notification.read ? "bg-neutral-300" : "bg-medical-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          notification.read
                            ? "text-neutral-500"
                            : "text-neutral-800 font-medium"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
              <p className="text-neutral-500">Aucune notification</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
