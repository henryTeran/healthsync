import React from "react";
import ReactDOM from "react-dom/client";
import "../src/theme/index.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthProvider";
import { ErrorBoundary } from "./shared/ui/ErrorBoundary";
import { initializeMonitoring } from "./app/monitoring/sentry";

initializeMonitoring();

ReactDOM.createRoot(document.querySelector("#myApp")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);