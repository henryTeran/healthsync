export const extractFrequency = (text) => {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/(\d+) fois par jour/);
  return match ? Number.parseInt(match[1], 10) : null;
};

export const extractDuration = (text) => {
  if (!text || typeof text !== "string") return null;

  let match = text.match(/(\d+) jour/);
  if (match) return Number.parseInt(match[1], 10);

  match = text.match(/(\d+) semaine/);
  if (match) return Number.parseInt(match[1], 10) * 7;

  match = text.match(/(\d+) mois/);
  if (match) return Number.parseInt(match[1], 10) * 30;

  return null;
};

export const calculateEndDate = (startDate, durationText) => {
  const duration = extractDuration(durationText);
  if (!startDate || !duration) return null;

  const start = new Date(startDate);
  start.setDate(start.getDate() + duration - 1);
  return start.toISOString().split("T")[0];
};

export const generateTimes = (frequencyText) => {
  const frequency = extractFrequency(frequencyText);
  if (!frequency) return [];

  const times = [];
  const startHour = 8;
  const interval = Math.floor(12 / frequency);

  for (let index = 0; index < frequency; index += 1) {
    times.push(`${startHour + index * interval}:00`);
  }

  return times;
};

export const generateMedicationReminders = (medications) => {
  const reminders = [];

  medications.forEach((medication) => {
    const { frequency, name } = medication;
    const intervals = 24 / frequency;
    let time = 8;

    for (let index = 0; index < frequency; index += 1) {
      reminders.push({
        medicationName: name,
        time: `${String(time).padStart(2, "0")}:00`,
      });
      time += intervals;
    }
  });

  return reminders;
};

export const generateMedicationSchedule = (medications, startDate) => {
  const schedule = [];
  const start = new Date(startDate);

  medications.forEach((medication) => {
    const { frequency, name } = medication;
    const interval = 24 / frequency;
    let time = 8;

    for (let index = 0; index < frequency; index += 1) {
      const reminderTime = new Date(start);
      reminderTime.setHours(time, 0, 0);
      schedule.push({
        medicationName: name,
        time: reminderTime.toISOString(),
      });
      time += interval;
    }
  });

  return schedule;
};
