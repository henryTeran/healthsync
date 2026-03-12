import * as Sentry from "@sentry/react";
import { buildErrorCode, ERROR_CODES } from "./errorCodes";

const isProduction = import.meta.env.PROD;

const toSerializableError = (error) => {
  if (!error) {
    return { message: "Unknown error" };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    };
  }

  return {
    message: typeof error === "string" ? error : "Non-Error exception",
    details: error,
  };
};

const sanitizeContext = (context = {}) => {
  const nextContext = { ...context };

  if (nextContext.token) nextContext.token = "[REDACTED]";
  if (nextContext.fcmToken) nextContext.fcmToken = "[REDACTED]";
  if (nextContext.password) nextContext.password = "[REDACTED]";

  return nextContext;
};

const writeConsole = (level, message, context) => {
  if (level === "debug" && !import.meta.env.DEV) {
    return;
  }

  const payload = context ? sanitizeContext(context) : undefined;
  const method = console[level] || console.log;
  method(`[${level.toUpperCase()}] ${message}`, payload || "");
};

const captureInSentry = (level, message, context) => {
  if (!isProduction) {
    return;
  }

  const safeContext = sanitizeContext(context);

  if (level === "error") {
    const error = safeContext?.error;
    const serializable = toSerializableError(error);

    Sentry.captureException(error instanceof Error ? error : new Error(serializable.message), {
      tags: {
        source: "frontend",
        feature: safeContext?.feature || "unknown",
        action: safeContext?.action || "unknown",
        code: safeContext?.code || ERROR_CODES.APP.UNKNOWN,
      },
      fingerprint: [
        safeContext?.code || ERROR_CODES.APP.UNKNOWN,
        safeContext?.feature || "unknown",
        safeContext?.action || "unknown",
      ],
      extra: {
        ...safeContext,
        error: serializable,
      },
      level: "error",
    });
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: safeContext,
  });
};

export const logDebug = (message, context) => {
  writeConsole("debug", message, context);
};

export const logInfo = (message, context) => {
  writeConsole("info", message, context);
  captureInSentry("info", message, context);
};

export const logWarn = (message, context) => {
  writeConsole("warn", message, context);
  captureInSentry("warning", message, context);
};

export const logError = (message, error, context = {}) => {
  const code =
    context?.code ||
    error?.code ||
    buildErrorCode({
      feature: context?.feature,
      action: context?.action,
      fallback: ERROR_CODES.APP.UNKNOWN,
    });

  const payload = {
    ...context,
    code,
    error: toSerializableError(error),
  };

  writeConsole("error", message, payload);
  captureInSentry("error", message, { ...context, code, error });
};
