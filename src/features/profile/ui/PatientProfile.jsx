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

  return <Profile id={userId} />;
};
