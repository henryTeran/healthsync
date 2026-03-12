import { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";

import { AuthContext } from "../../../../contexts/AuthContext";
import { Profile } from "../ProfilePage";
import { FollowedTable } from "./FollowedTable";
import { AppointmentRequestsTable } from "./AppointmentsRequestTabe";
import { logDebug, logWarn } from "../../../../shared/lib/logger";
import { ERROR_CODES } from "../../../../shared/lib/errorCodes";

export const DoctorProfile = () => {
  const { user } = useContext(AuthContext);
  const { doctorId: paramDoctorId } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Déterminer l'ID du médecin (connecté ou via URL)
  const doctorId = paramDoctorId || user?.uid;
  const isOwner = user?.uid === doctorId;

  // Simule le chargement (ou effectue un fetch réel si nécessaire)
  useEffect(() => {
    if (!doctorId) {
      setError("Aucun médecin trouvé.");
      setIsLoading(false);
      logWarn("DoctorProfile: doctorId manquant", {
        code: ERROR_CODES.PROFILE.LOAD_FAILED,
        feature: "profile",
        action: "DoctorProfile.resolveDoctorId",
        currentUserId: user?.uid,
      });
      return;
    }

    logDebug("DoctorProfile context", {
      feature: "profile",
      action: "DoctorProfile.render",
      doctorId,
      currentUserId: user?.uid,
      isOwner,
    });

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [doctorId, isOwner, user?.uid]);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
          <div className="h-7 w-52 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-full bg-gray-100 rounded mb-3" />
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Profil Médecin</h1>
        {isOwner && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-health-100 text-health-700">
            Espace personnel
          </span>
        )}
      </div>

      <Profile id={doctorId} />

      {isOwner && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Patients suivis</h2>
            <FollowedTable />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Demandes de suivi</h2>
            <AppointmentRequestsTable />
          </div>
        </div>
      )}
    </div>
  );
};
