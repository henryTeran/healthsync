export const ERROR_CODES = {
  APP: {
    UNKNOWN: "APP_UNKNOWN_ERROR",
    RUNTIME: "APP_RUNTIME_ERROR",
    VALIDATION: "APP_VALIDATION_ERROR",
  },
  AUTH: {
    LOGIN_FAILED: "AUTH_LOGIN_FAILED",
    REGISTER_FAILED: "AUTH_REGISTER_FAILED",
    LOGOUT_FAILED: "AUTH_LOGOUT_FAILED",
    RESET_PASSWORD_FAILED: "AUTH_RESET_PASSWORD_FAILED",
    PROFILE_LOAD_FAILED: "AUTH_PROFILE_LOAD_FAILED",
  },
  APPOINTMENTS: {
    FETCH_FAILED: "APPOINTMENTS_FETCH_FAILED",
    UPDATE_FAILED: "APPOINTMENTS_UPDATE_FAILED",
    DELETE_FAILED: "APPOINTMENTS_DELETE_FAILED",
    AVAILABILITY_FETCH_FAILED: "APPOINTMENTS_AVAILABILITY_FETCH_FAILED",
  },
  FIREBASE: {
    FCM_TOKEN_FAILED: "FIREBASE_FCM_TOKEN_FAILED",
    MESSAGING_INIT_FAILED: "FIREBASE_MESSAGING_INIT_FAILED",
    EMULATOR_CONNECT_FAILED: "FIREBASE_EMULATOR_CONNECT_FAILED",
  },
};

const toCodeChunk = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

export const buildErrorCode = ({ feature, action, fallback } = {}) => {
  const featureChunk = toCodeChunk(feature);
  const actionChunk = toCodeChunk(action);

  if (featureChunk && actionChunk) {
    return `${featureChunk}_${actionChunk}_FAILED`;
  }

  if (featureChunk) {
    return `${featureChunk}_FAILED`;
  }

  return fallback || ERROR_CODES.APP.UNKNOWN;
};
