/**
 * Domain Layer - Exports
 *
 * Central export point for all domain models, validators, and services.
 * Enables clean imports from domain layer.
 */

// ===== MODELS =====
export {
  APPLICATION_WORKFLOW,
  REGULATORY_WORKFLOW,
  PHARMACY_WORKFLOW,
  PRESCRIPTION_STATUS,
  isValidPrescriptionStatus,
  canTransitionPrescriptionStatus,
  getNextAllowedStatuses,
  isImmutableStatus,
  requiresRegulatoryData,
  getStatusLabel,
} from './models/PrescriptionStatuses.js';

export {
  createInternalPrescription,
  createDraftPrescription,
  updateInternalPrescription,
  markPrescriptionAsRevoked,
  markPrescriptionAsReplaced,
  validateInternalPrescription,
  isPrescriptionMutable,
  prepareInternalMedicationForRegulation,
} from './models/InternalPrescription.js';

export {
  createRegulatoryDataset,
  validateRegulatoryDataset,
  markAsSignedAndRegistered,
  markAsRevoked,
} from './models/RegulatoryDataset.js';

export {
  createRegulatoryMedication,
  validateRegulatoryMedication,
  transformToRegulatoryMedication,
  isValidForErezept,
} from './models/RegulatoryMedication.js';

// ===== VALIDATORS =====
export {
  VALIDATION_LAYER,
  ERROR_SEVERITY,
  UI_ERRORS,
  BUSINESS_ERRORS,
  REGULATORY_ERRORS,
  ERROR_MESSAGES,
  createValidationResult,
} from './validators/ValidationErrors.js';

export {
  validatePrescriptionBusiness,
  validatePrescriptionMutable,
  validateNotAlreadySigned,
  validateMedicationsBusiness,
  combineValidationResults,
} from './validators/BusinessValidator.js';

export {
  validateRegulatoryDataset as validateRegulatoryDatasetSchema,
  validateReadyForSigning,
  validateSignedAndRegistered,
} from './validators/RegulatoryValidator.js';

// ===== TRANSFORMATION SERVICES =====
export {
  transformInternalToRegulatoryDataset,
  getTransformationErrorsText,
} from './services/RegulatoryTransformer.js';

// ===== REVOCATION SERVICES =====
export {
  revokePrescription,
  createRevocationRecord,
  validateRevocationEligibility,
  getDefaultRevocationReason,
  prepareRevocationAuditLog,
} from './services/PrescriptionRevocation.js';

// ===== UTILITY FUNCTIONS (Re-exported from old ePrescriptionSwiss for backwards compat) =====
// These will be cleaned up in future refactoring
export {
  isSwissAvsValid,
  isGlnValid,
} from './ePrescriptionSwiss.js';
