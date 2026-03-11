import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth } from "../../../providers/firebase";
import { db } from "../../../providers/firebase";

const appointmentsCollection = collection(db, "appointments");
const availabilitiesCollection = collection(db, "availabilities");

export const findAppointmentsByField = async (field, userId) => {
  const appointmentsQuery = query(appointmentsCollection, where(field, "==", userId));
  return getDocs(appointmentsQuery);
};

export const createAppointmentRecord = async (payload) => {
  return addDoc(appointmentsCollection, payload);
};

export const getAppointmentByIdRecord = async (appointmentId) => {
  return getDoc(doc(db, "appointments", appointmentId));
};

export const updateAppointmentRecord = async (appointmentId, payload) => {
  return updateDoc(doc(db, "appointments", appointmentId), payload);
};

export const deleteAppointmentRecord = async (appointmentId) => {
  return deleteDoc(doc(db, "appointments", appointmentId));
};

export const findAvailabilitiesByDoctor = async (doctorId) => {
  const availabilitiesQuery = query(
    availabilitiesCollection,
    where("doctorId", "==", doctorId)
  );
  return getDocs(availabilitiesQuery);
};

export const createAvailabilityRecord = async (payload) => {
  return addDoc(availabilitiesCollection, payload);
};

export const updateAvailabilityRecord = async (availabilityId, payload) => {
  return updateDoc(doc(db, "availabilities", availabilityId), payload);
};

export const deleteAvailabilityRecord = async (availabilityId) => {
  return deleteDoc(doc(db, "availabilities", availabilityId));
};

export const getCurrentAuthenticatedUserId = () => {
  return auth.currentUser?.uid ?? null;
};
