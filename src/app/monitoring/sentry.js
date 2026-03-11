import * as Sentry from "@sentry/react";

let sentryInitialized = false;

export const initializeMonitoring = () => {
  if (sentryInitialized) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
    release: import.meta.env.VITE_APP_RELEASE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.2),
    replaysSessionSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE || 0.05),
    replaysOnErrorSampleRate: Number(import.meta.env.VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE || 1.0),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user?.email) {
        delete event.user.email;
      }
      return event;
    },
  });

  sentryInitialized = true;
};

export const setMonitoringUser = (user) => {
  if (!sentryInitialized) {
    return;
  }

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.uid,
    role: user.userType || user.type,
  });
};
