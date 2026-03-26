/**
 * Enhanced Prescription Repository
 *
 * Extensions to base prescriptionRepository for new E-Prescription collections:
 * - Regulatory Datasets (CHMED16A_R2 compliant)
 * - Audit Logs (immutable, for compliance)
 * - Revocation Records (permanent markers)
 *
 * Architecture:
 * - Immutable append-only collections (audit logs, revocations)
 * - Transaction support for critical operations
 * - Indexes for compliance queries
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../../providers/firebase";
import { logDebug, logError } from "../../../shared/lib/logger.js";

// Collection references
const regulatoryDatasetsCollection = collection(db, "regulatoryDatasets");
const auditLogsCollection = collection(db, "prescriptionAuditLogs");
const revocationRecordsCollection = collection(db, "prescriptionRevocations");
const signingTokensCollection = collection(db, "prescriptionSigningTokens");

// ===== REGULATORY DATASETS (CHMED16A_R2) =====

/**
 * Save regulatory dataset
 * Immutable record of CHMED16A dataset after transformation
 */
export const saveRegulatoryDataset = async (dataset) => {
  logDebug("Saving regulatory dataset", {
    feature: "prescriptions",
    layer: "infrastructure",
    datasetId: dataset.Id,
    standard: dataset.standard,
  });

  try {
    const docRef = await addDoc(regulatoryDatasetsCollection, {
      ...dataset,
      createdAt: Timestamp.now(),
      archived: false,
    });

    return {
      success: true,
      id: docRef.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError("Failed to save regulatory dataset", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      datasetId: dataset.Id,
    });
    throw error;
  }
};

/**
 * Get regulatory dataset by ID
 */
export const getRegulatoryDataset = async (datasetId) => {
  try {
    const datasetsQuery = query(
      regulatoryDatasetsCollection,
      where("Id", "==", datasetId),
      limit(1)
    );

    const snapshot = await getDocs(datasetsQuery);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { firebaseId: doc.id, ...doc.data() };
  } catch (error) {
    logError("Failed to get regulatory dataset", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      datasetId,
    });
    throw error;
  }
};

/**
 * Update regulatory dataset (mark as signed, revoked, etc)
 */
export const updateRegulatoryDataset = async (firebaseId, updates) => {
  logDebug("Updating regulatory dataset", {
    feature: "prescriptions",
    layer: "infrastructure",
    firebaseId,
    updates: Object.keys(updates),
  });

  try {
    await updateDoc(doc(db, "regulatoryDatasets", firebaseId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    logError("Failed to update regulatory dataset", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      firebaseId,
    });
    throw error;
  }
};

/**
 * Find regulatory datasets by internal prescription ID
 */
export const findRegulatoryDatasetsByPrescriptionId = async (prescriptionId) => {
  try {
    const datasetsQuery = query(
      regulatoryDatasetsCollection,
      where("InternalPrescriptionId", "==", prescriptionId)
    );

    const snapshot = await getDocs(datasetsQuery);
    return snapshot.docs.map((doc) => ({
      firebaseId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    logError("Failed to find regulatory datasets", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId,
    });
    throw error;
  }
};

// ===== AUDIT LOGS (Immutable, compliant) =====

/**
 * Create audit log entry (append-only, immutable)
 * Used for compliance, traceability, and regulatory requirements
 */
export const createAuditLogEntry = async (auditData) => {
  logDebug("Creating audit log entry", {
    feature: "prescriptions",
    layer: "infrastructure",
    action: auditData.action,
    prescriptionId: auditData.prescriptionId,
  });

  try {
    const docRef = await addDoc(auditLogsCollection, {
      ...auditData,
      timestamp: Timestamp.now(),
      // Immutable marker
      sealed: true,
      sealed_at: Timestamp.now(),
    });

    return {
      success: true,
      auditId: docRef.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError("Failed to create audit log entry", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId: auditData.prescriptionId,
    });
    throw error;
  }
};

/**
 * Get audit trail for prescription
 * Returns all audit entries chronologically
 */
export const getAuditTrail = async (prescriptionId) => {
  try {
    const logsQuery = query(
      auditLogsCollection,
      where("prescriptionId", "==", prescriptionId),
      orderBy("timestamp", "asc")
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map((doc) => ({
      auditId: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));
  } catch (error) {
    logError("Failed to get audit trail", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId,
    });
    throw error;
  }
};

/**
 * Get recent audit entries (for dashboard/notifications)
 */
export const getRecentAuditEntries = async (
  prescriptionId,
  maxEntries = 10
) => {
  try {
    const logsQuery = query(
      auditLogsCollection,
      where("prescriptionId", "==", prescriptionId),
      orderBy("timestamp", "desc"),
      limit(maxEntries)
    );

    const snapshot = await getDocs(logsQuery);
    return snapshot.docs.map((doc) => ({
      auditId: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));
  } catch (error) {
    logError("Failed to get recent audit entries", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId,
    });
    throw error;
  }
};

// ===== REVOCATION RECORDS (Permanent markers) =====

/**
 * Create revocation record (permanent, immutable)
 * Marks prescription as revoked at specific timestamp
 */
export const createRevocationRecord = async (revocationData) => {
  logDebug("Creating revocation record", {
    feature: "prescriptions",
    layer: "infrastructure",
    prescriptionId: revocationData.prescriptionId,
    revokedBy: revocationData.revokedBy,
  });

  try {
    const docRef = await addDoc(revocationRecordsCollection, {
      ...revocationData,
      createdAt: Timestamp.now(),
      // Permanent marker
      permanent: true,
      cannot_undo: true,
    });

    return {
      success: true,
      revocationId: docRef.id,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError("Failed to create revocation record", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId: revocationData.prescriptionId,
    });
    throw error;
  }
};

/**
 * Get revocation record for prescription
 * Returns null if not revoked
 */
export const getRevocationRecord = async (prescriptionId) => {
  try {
    const recQuery = query(
      revocationRecordsCollection,
      where("prescriptionId", "==", prescriptionId),
      limit(1)
    );

    const snapshot = await getDocs(recQuery);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      revocationId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    };
  } catch (error) {
    logError("Failed to get revocation record", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId,
    });
    throw error;
  }
};

// ===== SIGNING TOKENS (Storage of signed tokens) =====

/**
 * Store signed token for recovery + validation
 */
export const storeSigningToken = async (prescriptionId, tokenData) => {
  logDebug("Storing signing token", {
    feature: "prescriptions",
    layer: "infrastructure",
    prescriptionId,
    registrationId: tokenData.registrationId,
  });

  try {
    const docRef = await addDoc(signingTokensCollection, {
      prescriptionId,
      ...tokenData,
      createdAt: Timestamp.now(),
      // Mark as critical
      critical_data: true,
    });

    return {
      success: true,
      tokenId: docRef.id,
    };
  } catch (error) {
    logError("Failed to store signing token", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId,
    });
    throw error;
  }
};

/**
 * Retrieve stored signing token
 */
export const getStoredSigningToken = async (prescriptionId) => {
  try {
    const tokensQuery = query(
      signingTokensCollection,
      where("prescriptionId", "==", prescriptionId),
      limit(1)
    );

    const snapshot = await getDocs(tokensQuery);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      tokenId: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    logError("Failed to retrieve signing token", error, {
      feature: "prescriptions",
      layer: "infrastructure",
      prescriptionId,
    });
    throw error;
  }
};

// ===== COLLECTION STATS (For monitoring) =====

/**
 * Get statistics on collections for monitoring
 */
export const getCollectionStats = async () => {
  try {
    const [regulatoryCount, auditCount, revocationCount, tokenCount] =
      await Promise.all([
        getDocs(query(regulatoryDatasetsCollection, limit(1000))),
        getDocs(query(auditLogsCollection, limit(1000))),
        getDocs(query(revocationRecordsCollection, limit(1000))),
        getDocs(query(signingTokensCollection, limit(1000))),
      ]);

    return {
      regulatoryDatasets: regulatoryCount.size,
      auditLogs: auditCount.size,
      revocations: revocationCount.size,
      signingTokens: tokenCount.size,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError("Failed to get collection stats", error, {
      feature: "prescriptions",
      layer: "infrastructure",
    });
    return { error: error.message };
  }
};
