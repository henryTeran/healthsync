/**
 * Infrastructure Layer - Central Export
 *
 * Exports all infrastructure services:
 * - E-Rezept service client
 * - Enhanced repository functions
 * - Firebase collections
 */

// E-Rezept Service
export {
  getErezeptService,
  createMockErezeptService,
  createRealErezeptService,
  computeDatasetChecksum,
  buildSignedToken,
  validateServiceResponse,
} from "./erezeptServiceClient.js";

// Enhanced Repository - Regulatory Datasets
export {
  saveRegulatoryDataset,
  getRegulatoryDataset,
  updateRegulatoryDataset,
  findRegulatoryDatasetsByPrescriptionId,
} from "./enhancedPrescriptionRepository.js";

// Enhanced Repository - Audit Logs
export {
  createAuditLogEntry,
  getAuditTrail,
  getRecentAuditEntries,
} from "./enhancedPrescriptionRepository.js";

// Enhanced Repository - Revocations
export {
  createRevocationRecord,
  getRevocationRecord,
} from "./enhancedPrescriptionRepository.js";

// Enhanced Repository - Signing Tokens
export {
  storeSigningToken,
  getStoredSigningToken,
} from "./enhancedPrescriptionRepository.js";

// Enhanced Repository - Monitoring
export {
  getCollectionStats,
} from "./enhancedPrescriptionRepository.js";

// Base Repository (existing)
export {
  createPrescription,
  findByPatientId,
  findReceivedByPatientId,
  findByCreatorId,
  findById,
  updateById,
  activatePrescriptionOnce,
} from "./prescriptionRepository.firebase.js";
