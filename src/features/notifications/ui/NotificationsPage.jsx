import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { AuthContext } from "../../../contexts/AuthContext";
import {
  deleteNotification,
  getNotificationsByUser,
  markNotificationAsRead,
} from "../../../features/notifications";
import { logError } from "../../../shared/lib/logger";

export const NotificationsPage = ({ title = "Notifications" }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const notificationsData = await getNotificationsByUser(user.uid);
      setNotifications(
        [...notificationsData].sort(
          (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
        )
      );
    } catch (error) {
      logError("Erreur lors de la récupération des notifications", error, {
        feature: "notifications",
        action: "fetchNotifications",
        userId: user?.uid,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      try {
        await markNotificationAsRead(notificationId);
        fetchNotifications();
      } catch (error) {
        logError("Erreur mise à jour notification", error, {
          feature: "notifications",
          action: "handleMarkAsRead",
          notificationId,
        });
      }
    },
    [fetchNotifications]
  );

  const handleDeleteNotification = useCallback(
    async (notificationId) => {
      try {
        await deleteNotification(notificationId);
        fetchNotifications();
      } catch (error) {
        logError("Erreur suppression notification", error, {
          feature: "notifications",
          action: "handleDeleteNotification",
          notificationId,
        });
      }
    },
    [fetchNotifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{title}</h1>
          <p className="text-sm text-neutral-500">
            {unreadCount} non lue(s) sur {notifications.length}
          </p>
        </header>

        {isLoading ? (
          <div className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-10 text-center text-neutral-500">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-12 text-center">
            <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-[20px] bg-white border shadow-sm p-5 ${
                  notification.read ? "border-neutral-200 opacity-80" : "border-medical-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-neutral-800">{notification.message}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString("fr-FR")}
                    </p>
                    <span
                      className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        notification.read
                          ? "bg-neutral-100 text-neutral-700"
                          : "bg-health-100 text-health-700"
                      }`}
                    >
                      {notification.read ? "Lu" : "Non lu"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-health-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-health-700"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Lu
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

NotificationsPage.propTypes = {
  title: PropTypes.string,
};
