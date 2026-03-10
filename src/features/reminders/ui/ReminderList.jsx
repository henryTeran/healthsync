import React, { useEffect, useState } from "react";
import { getRemindersByUserRealtime, updateReminder, deleteReminder } from "../../../features/reminders";
import { useAuth } from "../../../contexts/AuthContext";

export const ReminderList = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    if (user) {
      const unsubscribe = getRemindersByUserRealtime(user.uid, setReminders);
      return () => unsubscribe();
    }
  }, [user]);

  const handleCompleteReminder = async (reminder) => {
    await updateReminder(reminder.id, { status: "completed" });
  };

  const handleDeleteReminder = async (reminderId) => {
    await deleteReminder(reminderId);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">📅 Historique des Rappels</h2>
      {reminders && reminders.length > 0 ? (
        <ul>
          {reminders.map((reminder) => (
            <li key={reminder.id} className="flex justify-between items-center p-3 border-b">
              <div>
                <p className="font-bold">{reminder.title}</p>
                <p className="text-sm text-gray-500">
                  {reminder.dateTime.toDate ? reminder.dateTime.toDate().toLocaleString() : new Date(reminder.dateTime).toLocaleString()}
                </p>
                <span className={`text-sm font-bold ${reminder.status === "completed" ? "text-green-500" : "text-gray-500"}`}>
                  {reminder.status === "completed" ? "✅ Terminé" : "⏳ En attente"}
                </span>
              </div>
              <div className="flex gap-2">
                {reminder.status === "pending" && (
                  <button
                    onClick={() => handleCompleteReminder(reminder)}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >
                    ✅ Marquer comme fait
                  </button>
                )}
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  ❌ Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Aucun rappel enregistré.</p>
      )}
    </div>
  );
};
