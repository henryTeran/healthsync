import { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from "..";
import { AuthContext } from "../../../contexts/AuthContext";
import { ListDoctorAvailable } from "./patient/ListDoctorAvailable";
import { ProfileCard } from "./ProfileCard";
import { logError, logInfo, logWarn } from "../../../shared/lib/logger";
import { ERROR_CODES } from "../../../shared/lib/errorCodes";

export const Profile = ({ id }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const profileId = id || user?.uid;

  useEffect(() => {
    if (!profileId) {
      setError("Utilisateur non connecté.");
      setIsLoading(false);
      logWarn("Impossible de charger le profil: identifiant manquant", {
        code: ERROR_CODES.PROFILE.LOAD_FAILED,
        feature: "profile",
        action: "Profile.load",
        currentUserId: user?.uid,
      });
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const loadedProfile = await getUserProfile(profileId);

        if (!loadedProfile) {
          setError("Profil introuvable.");
          setProfileData(null);
          return;
        }

        const normalizedUserType = loadedProfile.userType || loadedProfile.type || "patient";
        const normalizedProfile = {
          id: profileId,
          ...loadedProfile,
          userType: normalizedUserType,
          type: loadedProfile.type || normalizedUserType,
        };

        setProfileData(normalizedProfile);
        setError("");

        logInfo("Profil chargé avec succès", {
          feature: "profile",
          action: "Profile.load",
          profileId,
          userType: normalizedUserType,
        });
      } catch (profileError) {
        setError(profileError.message || "Erreur de chargement du profil.");
        logError("Échec du chargement du profil", profileError, {
          code: ERROR_CODES.PROFILE.LOAD_FAILED,
          feature: "profile",
          action: "Profile.load",
          profileId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileId, user?.uid]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="h-7 w-56 bg-gray-200 rounded mb-6" />
          <div className="h-4 w-full bg-gray-100 rounded mb-3" />
          <div className="h-4 w-5/6 bg-gray-100 rounded mb-3" />
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">Impossible de charger le profil</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => navigate(0)}
            className="mt-3 px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          Profil introuvable.
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === profileId;
  const userType = profileData.userType || profileData.type || "patient";

  return (
    <div className="p-4 space-y-6">
      <ProfileCard profile={profileData} isOwner={isOwner} userType={userType} />
      {userType === "patient" && isOwner && <ListDoctorAvailable />}
    </div>
  );
};

Profile.propTypes = {
  id: PropTypes.string,
};
