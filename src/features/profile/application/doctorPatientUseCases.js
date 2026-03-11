import { addNotification } from '../../notifications';
import { getUserProfileUseCase } from './profileUseCases';
import {
  createAuthorizedFollowLink,
  createFollowRequest,
  createMedicalHistory,
  findAuthorizedDoctorLinks,
  findAuthorizedPatientLinks,
  findFollowRequestsByDoctor,
  findMedicalHistoryByUser,
  findUserById,
  findUsersByType,
  updateFollowRequestStatus,
} from '../infrastructure/doctorPatientRepository.firebase';

export const getAuthorizedPatientsUseCase = async (doctorId) => {
  const querySnapshot = await findAuthorizedPatientLinks(doctorId);
  const patients = [];

  for (const document of querySnapshot.docs) {
    const linkData = document.data();
    const patient = await findUserById(linkData.patientId);
    if (patient) {
      patients.push({
        id: linkData.patientId,
        ...patient,
      });
    }
  }

  return patients;
};

export const getAuthorizedDoctorsUseCase = async (patientId) => {
  const querySnapshot = await findAuthorizedDoctorLinks(patientId);
  const doctors = [];

  for (const document of querySnapshot.docs) {
    const doctorId = document.data().doctorId;
    const doctor = await findUserById(doctorId);
    if (doctor) {
      doctors.push({ id: doctorId, ...doctor });
    }
  }

  return doctors;
};

export const getAllDoctorsUseCase = async () => {
  return findUsersByType('doctor');
};

export const getAllPatientsUseCase = async () => {
  return findUsersByType('patient');
};

export const requestFollowUseCase = async (patientId, doctorId) => {
  await createFollowRequest(patientId, doctorId);

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

export const followPatientAsDoctorUseCase = async (patientId, doctorProfile) => {
  await createAuthorizedFollowLink(patientId, doctorProfile.uid);

  const firstName = doctorProfile?.firstName || 'Inconnu';
  const lastName = doctorProfile?.lastName || 'Inconnu';

  await addNotification(patientId, {
    type: 'follow_response',
    message: `Le Dr. ${firstName} ${lastName} a accepte votre dossier.`,
    patientId,
    read: false,
  });
};

export const handleFollowRequestUseCase = async (patientId, doctorId, isAuthorized) => {
  await updateFollowRequestStatus(patientId, doctorId, isAuthorized);

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
  const querySnapshot = await findFollowRequestsByDoctor(doctorId);

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
  await createMedicalHistory(patientId, historyData);
};

export const getMedicalHistoryByUserUseCase = async (patientId) => {
  return findMedicalHistoryByUser(patientId);
};
