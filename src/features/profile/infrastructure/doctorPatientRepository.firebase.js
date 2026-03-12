import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../providers/firebase";
import { logError } from "../../../shared/lib/logger";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";

const auth = getAuth();

export const findAuthorizedPatientLinks = async (doctorId) => {
  const q = query(
    collection(db, "doctor_patient_links"),
    where("doctorId", "==", doctorId),
    where("authorized", "==", true)
  );
  return getDocs(q);
};

export const findAuthorizedDoctorLinks = async (patientId) => {
  const q = query(
    collection(db, "doctor_patient_links"),
    where("patientId", "==", patientId),
    where("authorized", "==", true)
  );
  return getDocs(q);
};

export const findFollowRequestsByDoctor = async (doctorId) => {
  const q = query(
    collection(db, "doctor_patient_links"),
    where("doctorId", "==", doctorId),
    where("authorized", "==", false)
  );
  return getDocs(q);
};

export const findUsersByType = async (type) => {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs
      .filter((item) => item.data().type === type)
      .map((item) => ({
        id: item.id,
        ...item.data(),
        signupDate: auth.currentUser?.metadata?.creationTime || "N/A",
      }));
  } catch (error) {
    logError("Échec récupération utilisateurs par type", error, {
      code:
        type === "doctor"
          ? ERROR_CODES.PROFILE.FETCH_DOCTORS_FAILED
          : ERROR_CODES.PROFILE.FETCH_PATIENTS_FAILED,
      feature: "profile",
      action: "findUsersByType",
      userType: type,
    });
    throw error;
  }
};

export const findUserById = async (userId) => {
  try {
    const snapshot = await getDoc(doc(db, "users", userId));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    logError("Échec récupération utilisateur", error, {
      code: ERROR_CODES.PROFILE.LOAD_FAILED,
      feature: "profile",
      action: "findUserById",
      userId,
    });
    throw error;
  }
};

export const createFollowRequest = async (patientId, doctorId) => {
  const linkRef = doc(db, "doctor_patient_links", `${doctorId}_${patientId}`);
  await setDoc(linkRef, {
    patientId,
    doctorId,
    authorized: false,
    refuse: true,
    createdAt: new Date().toISOString(),
  });
};

export const createAuthorizedFollowLink = async (patientId, doctorId) => {
  const linkRef = doc(db, "doctor_patient_links", `${doctorId}_${patientId}`);
  await setDoc(linkRef, {
    patientId,
    doctorId,
    authorized: true,
    refuse: false,
    createdAt: new Date().toISOString(),
  });
};

export const updateFollowRequestStatus = async (patientId, doctorId, isAuthorized) => {
  const linkRef = doc(db, "doctor_patient_links", `${doctorId}_${patientId}`);
  await updateDoc(linkRef, {
    authorized: isAuthorized,
    refuse: !isAuthorized,
  });
};

export const createMedicalHistory = async (patientId, historyData) => {
  const docId = `${patientId}_history_${Date.now()}`;
  await setDoc(doc(db, "medicalHistory", docId), { ...historyData, patientId });
};

export const findMedicalHistoryByUser = async (patientId) => {
  const q = query(collection(db, "medicalHistory"), where("userId", "==", patientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};
