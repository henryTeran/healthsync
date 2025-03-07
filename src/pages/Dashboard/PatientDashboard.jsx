// // src/components/PatientDashboard.jsx

import React, { useState } from "react";
import { ReminderList } from "../../components/ReminderList";
import { CreateReminder } from "../../components/CreateReminder";


 export const PatientDashboard = () => {
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📅 Gestion des Rappels</h1>

      <CreateReminder onReminderAdded={() => setRefresh(!refresh)} />

      <div className="mt-6">
        <ReminderList key={refresh} />
      </div>
    </div>
  );
};

 