import React, { useState } from "react";
import { addReminder } from "../../../features/reminders";
import { useAuth } from "../../../contexts/AuthContext";

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
        recurrence,
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
    <div className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-neutral-800 mb-1">Nouveau rappel</h2>
      <p className="text-sm text-neutral-600 mb-4">Planifiez un rappel clinique ponctuel ou récurrent.</p>
      <form onSubmit={handleCreateReminder} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Titre du rappel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          required
        />

        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="input"
          required
        />

        <select
          value={notificationType}
          onChange={(e) => setNotificationType(e.target.value)}
          className="input"
        >
          <option value="push">🔔 Notification push</option>
          <option value="email">📧 Email</option>
          <option value="sms">📱 SMS</option>
        </select>
        <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="input"
        >
            <option value="once">📌 Une seule fois</option>
            <option value="daily">🔄 Quotidien</option>
            <option value="weekly">📅 Hebdomadaire</option>
            <option value="monthly">📆 Mensuel</option>
        </select>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Ajout en cours..." : "Créer le rappel"}
        </button>
      </form>
    </div>
  );
};
