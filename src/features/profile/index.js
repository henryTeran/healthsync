export {
  getPatientPreferencesUseCase,
  getUserProfileUseCase,
  saveUserProfileUseCase,
  uploadProfilePictureUseCase,
} from "./application/profileUseCases";

export {
  getPatientPreferencesUseCase as getPatientPreferences,
  getUserProfileUseCase as getUserProfile,
  saveUserProfileUseCase as saveUserProfile,
  uploadProfilePictureUseCase as uploadProfilePicture,
} from "./application/profileUseCases";

export {
  addMedicalHistoryUseCase as addMedicalHistory,
  getAllDoctorsUseCase as getAllDoctors,
  getAllPatientsUseCase as getAllPatients,
  getAuthorizedDoctorsUseCase as getAuthorizedDoctors,
  getAuthorizedPatientsUseCase as getAuthorizedPatients,
  getFollowRequestsUseCase as getFollowRequests,
  getMedicalHistoryByUserUseCase as getMedicalHistoryByUser,
  handleFollowRequestUseCase as handleFollowRequest,
  requestFollowUseCase as requestFollow,
} from "./application/doctorPatientUseCases";
