import { addNotification } from '../../notifications';
import { getUserProfileUseCase } from './profileUseCases';
import { logError, logInfo } from '../../../shared/lib/logger';
import { ERROR_CODES } from '../../../shared/lib/errorCodes';
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
  try {
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
  } catch (error) {
    logError('Échec récupération patients autorisés', error, {
      code: ERROR_CODES.PROFILE.FETCH_PATIENTS_FAILED,
      feature: 'profile',
      action: 'getAuthorizedPatientsUseCase',
      doctorId,
    });
    throw error;
  }
};

export const getAuthorizedDoctorsUseCase = async (patientId) => {
  try {
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
  } catch (error) {
    logError('Échec récupération médecins autorisés', error, {
      code: ERROR_CODES.PROFILE.FETCH_DOCTORS_FAILED,
      feature: 'profile',
      action: 'getAuthorizedDoctorsUseCase',
      patientId,
    });
    throw error;
  }
};

export const getAllDoctorsUseCase = async () => {
  return findUsersByType('doctor');
};

export const getAllPatientsUseCase = async () => {
  return findUsersByType('patient');
};

export const requestFollowUseCase = async (patientId, doctorId) => {
  try {
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

    logInfo('Demande de suivi envoyée', {
      feature: 'profile',
      action: 'requestFollowUseCase',
      patientId,
      doctorId,
    });
  } catch (error) {
    logError('Échec envoi demande de suivi', error, {
      code: ERROR_CODES.PROFILE.FOLLOW_REQUEST_FAILED,
      feature: 'profile',
      action: 'requestFollowUseCase',
      patientId,
      doctorId,
    });
    throw error;
  }
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
  try {
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

    logInfo('Réponse à la demande de suivi traitée', {
      feature: 'profile',
      action: 'handleFollowRequestUseCase',
      patientId,
      doctorId,
      isAuthorized,
    });
  } catch (error) {
    logError('Échec traitement de la demande de suivi', error, {
      code: ERROR_CODES.PROFILE.FOLLOW_RESPONSE_FAILED,
      feature: 'profile',
      action: 'handleFollowRequestUseCase',
      patientId,
      doctorId,
      isAuthorized,
    });
    throw error;
  }
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
