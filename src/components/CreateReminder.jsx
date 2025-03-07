import React, { useState } from "react";
import { addReminder } from "../services/reminderService";
import { useAuth } from "../contexts/AuthContext";

export const CreateReminder = ({ onReminderAdded }) => {
  const { user } = useAuth();
  const [recurrence, setRecurrence] = useState("once");
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notificationType, setNotificationType] = useState("push");
  const [loading, setLoading] = useState(false);

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!title || !dateTime) {
      alert("Veuillez remplir tous les champs !");
      return;
    }

    setLoading(true);
    try {
      await addReminder(user.uid, {
        title,
        dateTime: new Date(dateTime),
        notificationType,
        status: "pending",
      });

      alert("Rappel créé avec succès !");
      setTitle("");
      setDateTime("");
      setNotificationType("push");

      if (onReminderAdded) {
        onReminderAdded();
      }
    } catch (error) {
      alert("Erreur lors de l'ajout du rappel.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">➕ Ajouter un rappel</h2>
      <form onSubmit={handleCreateReminder} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Titre du rappel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="p-2 border rounded"
          required
        />

        <select
          value={notificationType}
          onChange={(e) => setNotificationType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="push">🔔 Notification push</option>
          <option value="email">📧 Email</option>
          <option value="sms">📱 SMS</option>
        </select>
        <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="p-2 border rounded"
        >
            <option value="once">📌 Une seule fois</option>
            <option value="daily">🔄 Quotidien</option>
            <option value="weekly">📅 Hebdomadaire</option>
            <option value="monthly">📆 Mensuel</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Ajout en cours..." : "Créer le rappel"}
        </button>
      </form>
    </div>
  );
};
