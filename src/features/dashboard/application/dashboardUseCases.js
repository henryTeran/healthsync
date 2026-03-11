import { getAppointmentsByUser } from "../../appointments";
import { getPrescriptionsByPatient, getPrescriptionsByUser } from "../../prescriptions";
import { getAuthorizedPatients, getUserProfile } from "../../profile";
import {
  findActiveUserMedications,
  findRecentSymptomsByUser,
  listenRecentActivitiesByUser,
} from "../infrastructure/dashboardRepository.firebase";

export const listenRecentActivityUseCase = (userId, callback) => {
  return listenRecentActivitiesByUser(userId, callback);
};

export const getPatientDashboardDataUseCase = async (userId) => {
  const [profile, appointments, prescriptions, symptoms, medications] = await Promise.all([
    getUserProfile(userId),
    getAppointmentsByUser(userId, "patient"),
    getPrescriptionsByPatient(userId),
    findRecentSymptomsByUser(userId, 3),
    findActiveUserMedications(userId, 3),
  ]);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const upcomingAppointments = appointments.filter(
    (appointment) => new Date(appointment.date) >= new Date(today) && appointment.status === "accepté"
  ).length;

  const activePrescriptions = prescriptions.filter(
    (prescription) => prescription.status === "received" || prescription.status === "validated"
  ).length;

  const symptomsThisWeek = symptoms.filter(
    (symptom) => new Date(symptom.date) >= weekStart
  ).length;

  const medicationsToday = medications.filter((medication) => {
    if (!medication.times || !medication.startDate || !medication.endDate) {
      return false;
    }
    const start = new Date(medication.startDate);
    const end = new Date(medication.endDate);
    return now >= start && now <= end;
  }).length;

  return {
    profile,
    recentSymptoms: symptoms,
    recentMedications: medications,
    stats: {
      upcomingAppointments,
      activePrescriptions,
      symptomsThisWeek,
      medicationsToday,
    },
  };
};

export const getDoctorDashboardDataUseCase = async (userId) => {
  const [profile, patients, appointments, prescriptions] = await Promise.all([
    getUserProfile(userId),
    getAuthorizedPatients(userId),
    getAppointmentsByUser(userId, "doctor"),
    getPrescriptionsByUser(userId),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const todayAppointments = appointments.filter((appointment) => appointment.date === today).length;
  const pendingPrescriptions = prescriptions.filter((prescription) => prescription.status === "send").length;
  const weeklyConsultations = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate >= weekStart && appointment.status === "accepté";
  }).length;

  return {
    profile,
    stats: {
      totalPatients: patients.length,
      todayAppointments,
      pendingPrescriptions,
      weeklyConsultations,
    },
  };
};
