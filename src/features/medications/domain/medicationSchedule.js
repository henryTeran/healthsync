export const extractFrequency = (text) => {
  if (!text || typeof text !== "string") return null;

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const directPerDay = normalized.match(/(\d+)\s*(x|fois)?\s*(par\s*)?(jour|j)/);
  if (directPerDay) return Number.parseInt(directPerDay[1], 10);

  if (normalized.includes("matin") && normalized.includes("midi") && normalized.includes("soir")) {
    return 3;
  }

  if (normalized.includes("matin") && normalized.includes("soir")) {
    return 2;
  }

  const anyNumber = normalized.match(/(\d+)/);
  if (anyNumber) {
    const parsed = Number.parseInt(anyNumber[1], 10);
    if (parsed > 0 && parsed <= 8) return parsed;
  }

  return null;
};

export const extractDuration = (text) => {
  if (!text || typeof text !== "string") return null;

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  let match = normalized.match(/(\d+)\s*jour/);
  if (match) return Number.parseInt(match[1], 10);

  match = normalized.match(/(\d+)\s*semaine/);
  if (match) return Number.parseInt(match[1], 10) * 7;

  match = normalized.match(/(\d+)\s*mois/);
  if (match) return Number.parseInt(match[1], 10) * 30;

  match = normalized.match(/(\d+)\s*(j|jr)/);
  if (match) return Number.parseInt(match[1], 10);

  const anyNumber = normalized.match(/(\d+)/);
  if (anyNumber) {
    const parsed = Number.parseInt(anyNumber[1], 10);
    if (parsed > 0) return parsed;
  }

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
