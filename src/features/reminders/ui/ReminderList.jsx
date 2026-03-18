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
    <div className="rounded-[20px] bg-white border border-neutral-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-neutral-800 mb-1">Historique des rappels</h2>
      <p className="text-sm text-neutral-600 mb-4">Suivez vos rappels et leur état d'exécution.</p>
      {reminders && reminders.length > 0 ? (
        <ul className="space-y-3">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="rounded-2xl border border-neutral-200 p-4 hover:border-medical-300 hover:shadow-sm transition">
              <div className="flex justify-between items-start gap-4">
                <div>
                <p className="font-semibold text-neutral-800">{reminder.title}</p>
                <p className="text-sm text-neutral-500">
                  {reminder.dateTime.toDate ? reminder.dateTime.toDate().toLocaleString() : new Date(reminder.dateTime).toLocaleString()}
                </p>
                <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${reminder.status === "completed" ? "bg-health-100 text-health-700" : "bg-neutral-100 text-neutral-700"}`}>
                  {reminder.status === "completed" ? "✅ Terminé" : "⏳ En attente"}
                </span>
              </div>
              <div className="flex gap-2">
                {reminder.status === "pending" && (
                  <button
                    onClick={() => handleCompleteReminder(reminder)}
                    className="rounded-lg bg-health-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-health-700"
                  >
                    ✅ Marquer comme fait
                  </button>
                )}
                <button
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                  ❌ Supprimer
                </button>
              </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-500">
          Aucun rappel enregistré.
        </div>
      )}
    </div>
  );
};
