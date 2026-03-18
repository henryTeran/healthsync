import React, { useState } from "react";
import { CreateReminder } from "./CreateReminder";
import { ReminderList } from "./ReminderList";

export const RemindersPage = () => {
  const [reload, setReload] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/40 to-neutral-50 p-4 md:p-6 lg:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Gestion des rappels</h1>
          <p className="text-sm text-neutral-500">Planifiez et suivez vos rappels thérapeutiques.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CreateReminder onReminderAdded={() => setReload(!reload)} />
          </div>
          <div className="lg:col-span-2">
            <ReminderList key={reload} />
          </div>
        </div>
      </div>
    </div>
  );
};
