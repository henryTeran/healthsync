import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";

const symptomsCollection = collection(db, "symptoms");

export const createSymptomRecord = async (payload) => {
  await addDoc(symptomsCollection, payload);
};

export const subscribeSymptomsByUser = (userId, callback) => {
  const symptomsQuery = query(symptomsCollection, where("userId", "==", userId));

  return onSnapshot(symptomsQuery, (snapshot) => {
    const symptoms = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    callback(symptoms);
  });
};

export const updateSymptomRecord = async (symptomId, payload) => {
  await updateDoc(doc(db, "symptoms", symptomId), payload);
};

export const deleteSymptomRecord = async (symptomId) => {
  await deleteDoc(doc(db, "symptoms", symptomId));
};
