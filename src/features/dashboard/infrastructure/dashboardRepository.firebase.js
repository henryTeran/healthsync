import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../providers/firebase";
import { logError, logWarn } from "../../../shared/lib/logger";

export const listenRecentActivitiesByUser = (userId, callback) => {
  const q = query(
    collection(db, "activities"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      callback(activities);
    },
    (error) => {
      if (error?.code === "permission-denied") {
        logWarn("Accès refusé aux activités dashboard, fallback sur liste vide", {
          feature: "dashboard",
          action: "listenRecentActivitiesByUser",
          userId,
          code: error.code,
        });
        callback([]);
        return;
      }

      logError("Erreur realtime activités dashboard", error, {
        feature: "dashboard",
        action: "listenRecentActivitiesByUser",
        userId,
        code: error?.code,
      });
      callback([]);
    }
  );
};

export const findRecentSymptomsByUser = async (userId, max = 3) => {
  const symptomsQuery = query(
    collection(db, "symptoms"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(max)
  );

  const symptomsSnapshot = await getDocs(symptomsQuery);
  return symptomsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const findActiveUserMedications = async (userId, max = 3) => {
  const medicationsQuery = query(
    collection(db, "userMedications"),
    where("userId", "==", userId),
    where("status", "==", "active"),
    limit(max)
  );

  const medicationsSnapshot = await getDocs(medicationsQuery);
  return medicationsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
};
