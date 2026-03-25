import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";
import {
  PRESCRIPTION_STATUS,
  RECEIVED_OR_ACTIONABLE_STATUSES,
} from "../domain/prescriptionStatus";

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
    where("status", "in", RECEIVED_OR_ACTIONABLE_STATUSES)
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

export const activatePrescriptionOnce = async (idPrescription, startDate) => {
  const prescriptionRef = doc(db, "prescriptions", idPrescription);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(prescriptionRef);
    if (!snapshot.exists()) {
      throw new Error("Prescription introuvable.");
    }

    const current = snapshot.data();
    const alreadyValidated =
      [
        PRESCRIPTION_STATUS.VALIDATED_BY_PATIENT,
        PRESCRIPTION_STATUS.ACTIVE,
        PRESCRIPTION_STATUS.COMPLETED,
      ].includes(current?.status) ||
      Boolean(current?.validation?.validatedByPatient) ||
      Boolean(current?.validation?.validatedAt) ||
      Boolean(current?.validation?.patientStartDate);

    if (alreadyValidated) {
      return { alreadyValidated: true, current };
    }

    transaction.update(prescriptionRef, {
      status: PRESCRIPTION_STATUS.ACTIVE,
      validation: {
        ...(current?.validation || {}),
        validatedByPatient: true,
        validatedAt: new Date().toISOString(),
        patientStartDate: startDate,
      },
      statusUpdatedAt: new Date().toISOString(),
    });

    return { alreadyValidated: false };
  });
};
