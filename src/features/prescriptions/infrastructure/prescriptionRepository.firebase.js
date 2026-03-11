import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";

const prescriptionsCollection = collection(db, "prescriptions");

export const createPrescription = async (prescriptionData) => {
  const docRef = await addDoc(prescriptionsCollection, prescriptionData);
  return docRef.id;
};

export const findByPatientId = async (patientId) => {
  const prescriptionsQuery = query(
    prescriptionsCollection,
    where("patientId", "==", patientId)
  );

  const snapshot = await getDocs(prescriptionsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const findReceivedByPatientId = async (patientId) => {
  const prescriptionsQuery = query(
    prescriptionsCollection,
    where("patientId", "==", patientId),
    where("status", "==", "received")
  );

  const snapshot = await getDocs(prescriptionsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const findByCreatorId = async (createdBy) => {
  const prescriptionsQuery = query(
    prescriptionsCollection,
    where("createdBy", "==", createdBy)
  );

  const snapshot = await getDocs(prescriptionsQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const findById = async (idPrescription) => {
  const snapshot = await getDoc(doc(db, "prescriptions", idPrescription));
  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() };
};

export const updateById = async (idPrescription, payload) => {
  await updateDoc(doc(db, "prescriptions", idPrescription), payload);
};
