import { sendNotification } from "../../notifications";
import { generateTimes } from "../../medications";
import {
  createReminderRecord,
  deleteReminderRecord,
  findMedicationReminders,
  findMedicationsByPrescription,
  subscribeRemindersByUser,
  updateMedicationRecord,
  updateReminderRecord,
} from "../infrastructure/reminderRepository.firebase";

export const addReminderUseCase = async (userId, medication) => {
  const reminderData = {
    userId,
    medicationId: medication.id,
    medicationName: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency,
    startDate: medication.startDate,
    endDate: medication.endDate,
    times: medication.times,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const reminderId = await createReminderRecord(reminderData);
  scheduleMedicationRemindersUseCase(userId, medication);
  return reminderId;
};

export const getRemindersByUserRealtimeUseCase = (userId, callback) => {
  return subscribeRemindersByUser(userId, callback);
};

export const updateReminderUseCase = async (reminderId, updatedData) => {
  await updateReminderRecord(reminderId, updatedData);
};

export const deleteReminderUseCase = async (reminderId) => {
  await deleteReminderRecord(reminderId);
};

export const listenForRemindersUseCase = (userId) => {
  return subscribeRemindersByUser(userId, async (reminders) => {
    const now = new Date();

    for (const reminder of reminders) {
      const reminderTime = new Date(reminder.time);
      if (reminderTime <= now && !reminder.sent) {
        await sendNotification(userId, reminder.title, reminder.message);
        await updateReminderUseCase(reminder.id, { sent: true });
      }
    }
  });
};

export const updateMedicationScheduleUseCase = async (prescriptionId, newStartDate) => {
  const medSnapshot = await findMedicationsByPrescription(prescriptionId);

  const updates = medSnapshot.docs.map((medDoc) => {
    const medicationData = medDoc.data();
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + (medicationData.duration || 0));

    return updateMedicationRecord(medDoc.id, {
      startDate: newStartDate,
      endDate: newEndDate.toISOString().split("T")[0],
    });
  });

  await Promise.all(updates);
};

export const scheduleMedicationRemindersUseCase = async (userId, medication) => {
  const times = generateTimes(medication.frequency);
  const existingReminders = await findMedicationReminders(medication.id);

  if (!existingReminders.empty) {
    return;
  }

  for (const time of times) {
    await createReminderRecord({
      userId,
      idMedication: medication.id,
      title: `Rappel Médicament : ${medication.name}`,
      dateTime: `${medication.startDate}T${time}:00`,
      status: "pending",
    });
  }
};

export const updateMedicationRemindersUseCase = async (userId, medication) => {
  const existingReminders = await findMedicationReminders(medication.id);

  await Promise.all(
    existingReminders.docs.map((item) => updateReminderRecord(item.id, { status: "canceled" }))
  );

  await scheduleMedicationRemindersUseCase(userId, medication);
};
