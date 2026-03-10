import React, { useState } from "react";
import { CreateReminder } from "./CreateReminder";
import { ReminderList } from "./ReminderList";

export const RemindersPage = () => {
  const [reload, setReload] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🔔 Gestion des Rappels</h1>
      <CreateReminder onReminderAdded={() => setReload(!reload)} />
      <ReminderList key={reload} />
    </div>
  );
};
