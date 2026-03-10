import { db } from '../../../providers/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { addNotification } from '../../notifications';
import { getUserProfileUseCase } from './profileUseCases';

const auth = getAuth();

export const getAuthorizedPatientsUseCase = async (doctorId) => {
  const q = query(
    collection(db, 'doctor_patient_links'),
    where('doctorId', '==', doctorId),
    where('authorized', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const patients = [];

  for (const document of querySnapshot.docs) {
    const linkData = document.data();
    const patientRef = doc(db, 'users', linkData.patientId);
    const patientSnapshot = await getDoc(patientRef);

    if (patientSnapshot.exists()) {
      patients.push({
        id: linkData.patientId,
        ...patientSnapshot.data(),
      });
    }
  }

  return patients;
};

export const getAuthorizedDoctorsUseCase = async (patientId) => {
  const q = query(
    collection(db, 'doctor_patient_links'),
    where('patientId', '==', patientId),
    where('authorized', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const doctors = [];

  for (const document of querySnapshot.docs) {
    const doctorId = document.data().doctorId;
    const doctorRef = doc(db, 'users', doctorId);
    const doctorSnapshot = await getDoc(doctorRef);

    if (doctorSnapshot.exists()) {
      doctors.push({ id: doctorId, ...doctorSnapshot.data() });
    }
  }

  return doctors;
};

export const getAllDoctorsUseCase = async () => {
  const doctorsSnapshot = await getDocs(collection(db, 'users'));
  const doctorsList = [];

  for (const item of doctorsSnapshot.docs) {
    const doctorData = item.data();
    if (doctorData.type === 'doctor') {
      doctorsList.push({
        id: item.id,
        ...doctorData,
        signupDate: auth.currentUser?.metadata?.creationTime || 'N/A',
      });
    }
  }

  return doctorsList;
};

export const getAllPatientsUseCase = async () => {
  const patientsSnapshot = await getDocs(collection(db, 'users'));
  const patientsList = [];

  for (const item of patientsSnapshot.docs) {
    const patientData = item.data();
    if (patientData.type === 'patient') {
      patientsList.push({
        id: item.id,
        ...patientData,
        signupDate: auth.currentUser?.metadata?.creationTime || 'N/A',
      });
    }
  }

  return patientsList;
};

export const requestFollowUseCase = async (patientId, doctorId) => {
  const linkRef = doc(db, 'doctor_patient_links', `${doctorId}_${patientId}`);
  await setDoc(linkRef, {
    patientId,
    doctorId,
    authorized: false,
    refuse: true,
    createdAt: new Date().toISOString(),
  });

  const patientProfile = await getUserProfileUseCase(patientId);
  const firstName = patientProfile?.firstName || 'Inconnu';
  const lastName = patientProfile?.lastName || 'Inconnu';

  await addNotification(doctorId, {
    type: 'follow_request',
    message: `Le patient ${firstName} ${lastName}  souhaite que vous le suiviez.`,
    patientId,
    read: false,
  });
};

export const handleFollowRequestUseCase = async (patientId, doctorId, isAuthorized) => {
  const linkRef = doc(db, 'doctor_patient_links', `${doctorId}_${patientId}`);
  await updateDoc(linkRef, {
    authorized: isAuthorized,
    refuse: !isAuthorized,
  });

  const doctorProfile = await getUserProfileUseCase(doctorId);
  const firstName = doctorProfile?.firstName || 'Inconnu';
  const lastName = doctorProfile?.lastName || 'Inconnu';

  await addNotification(patientId, {
    type: 'follow_response',
    message: isAuthorized
      ? `Le médecin ${firstName} ${lastName} a accepté votre demande de suivi.`
      : `Le médecin ${firstName} ${lastName} a refusé votre demande de suivi.`,
    patientId,
    read: false,
  });
};

export const getFollowRequestsUseCase = async (doctorId) => {
  const q = query(
    collection(db, 'doctor_patient_links'),
    where('doctorId', '==', doctorId),
    where('authorized', '==', false)
  );
  const querySnapshot = await getDocs(q);

  const requests = querySnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return Promise.all(
    requests.map(async (request) => {
      try {
        const patientProfile = await getUserProfileUseCase(request.patientId);
        return {
          ...request,
          firstName: patientProfile?.firstName || 'Inconnu',
          lastName: patientProfile?.lastName || 'Inconnu',
        };
      } catch {
        return {
          ...request,
          firstName: 'Erreur',
          lastName: 'Erreur',
        };
      }
    })
  );
};

export const addMedicalHistoryUseCase = async (patientId, historyData) => {
  const docId = `${patientId}_history_${Date.now()}`;
  await setDoc(doc(db, 'medicalHistory', docId), { ...historyData, patientId });
};

export const getMedicalHistoryByUserUseCase = async (patientId) => {
  const q = query(collection(db, 'medicalHistory'), where('userId', '==', patientId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};
