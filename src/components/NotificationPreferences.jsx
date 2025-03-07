import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getNotificationPreferences, setNotificationPreferences } from "../services/notificationService";

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    fcmEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    preferredTimes: ["08:00", "12:00", "20:00"],
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences(user.uid);
      if (prefs) setPreferences(prefs);
    } catch (error) {
      console.error("Erreur lors du chargement des préférences :", error);
    }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setNotificationPreferences(user.uid, preferences);
      alert("Préférences mises à jour !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Préférences de notification</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <input type="checkbox" name="fcmEnabled" checked={preferences.fcmEnabled} onChange={handleChange} />
          Notifications Firebase (FCM)
        </label>
        <label>
          <input type="checkbox" name="emailEnabled" checked={preferences.emailEnabled} onChange={handleChange} />
          Notifications Email
        </label>
        <label>
          <input type="checkbox" name="smsEnabled" checked={preferences.smsEnabled} onChange={handleChange} />
          Notifications SMS
        </label>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">
          Sauvegarder
        </button>
      </form>
    </div>
  );
};
