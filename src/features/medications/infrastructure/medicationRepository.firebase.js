import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";

const medicationsCollection = collection(db, "medications");
const userMedicationsCollection = collection(db, "userMedications");

export const createMedication = async (medicationData) => {
  const docRef = await addDoc(medicationsCollection, medicationData);
  return docRef.id;
};

export const findByPrescriptionId = async (idPrescription) => {
  const medicationsQuery = query(
    medicationsCollection,
    where("idPrescription", "==", idPrescription)
  );
  const querySnapshot = await getDocs(medicationsQuery);

  return querySnapshot.docs.map((snapshot) => {
    const data = snapshot.data();

    return {
      ...data,
      id: data?.id ?? snapshot.id,
      documentId: snapshot.id,
    };
  });
};

export const removeById = async (idMedication) => {
  if (!idMedication || typeof idMedication !== "string") {
    throw new Error("Identifiant document médicament invalide.");
  }

  await deleteDoc(doc(db, "medications", idMedication));
};

export const updateById = async (medicationId, updatedData) => {
  await updateDoc(doc(db, "medications", medicationId), updatedData);
};

export const findUserTrackedMedication = async (medicationId, name) => {
  const medicationQuery = query(
    userMedicationsCollection,
    where("idMedication", "==", medicationId),
    where("name", "==", name)
  );

  return getDocs(medicationQuery);
};

export const findUserTrackedMedicationBySource = async (
  userId,
  sourcePrescriptionId,
  sourceMedicationId
) => {
  const medicationQuery = query(
    userMedicationsCollection,
    where("userId", "==", userId),
    where("sourcePrescriptionId", "==", sourcePrescriptionId),
    where("sourceMedicationId", "==", sourceMedicationId)
  );

  return getDocs(medicationQuery);
};

export const addUserMedication = async (payload) => {
  const docRef = await addDoc(userMedicationsCollection, payload);
  return docRef.id;
};

export const findByPrescriptionAndName = async (idPrescription, name) => {
  const medicationQuery = query(
    medicationsCollection,
    where("idPrescription", "==", idPrescription),
    where("name", "==", name)
  );

  return getDocs(medicationQuery);
};
