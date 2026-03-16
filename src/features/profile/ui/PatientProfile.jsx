import { useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import { Profile } from "./ProfilePage";
import { logDebug } from "../../../shared/lib/logger";

export const PatientProfile = () => {
  const { user } = useContext(AuthContext);
  const { userId: paramUserId } = useParams();

  const userId = paramUserId || user?.uid;

  logDebug("PatientProfile context", {
    feature: "profile",
    action: "PatientProfile.render",
    userId,
    paramUserId,
    currentUserId: user?.uid,
  });

  return (
    <div className="space-y-4">
      <header className="px-4 pt-2">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Profil Patient</h1>
        <p className="text-sm text-neutral-500">Consultation des informations patient (hors dashboard).</p>
      </header>
      <Profile id={userId} />
    </div>
  );
};
