/**
 * Prescription Revocation Service
 *
 * Handles revocation of signed/registered prescriptions.
 *
 * Key characteristics:
 * - Revocation is PERMANENT and IMMUTABLE
 * - Creates audit trail
 * - Allows optional replacement prescription
 * - Both internal and regulatory datasets are marked as revoked
 */

import { markPrescriptionAsRevoked, markPrescriptionAsReplaced } from '../models/InternalPrescription.js';
import { markAsRevoked } from '../models/RegulatoryDataset.js';

/**
 * Revoke a signed prescription
 *
 * @param {Object} internalPrescription - Internal prescription to revoke
 * @param {Object} regulatoryDataset - Regulatory dataset to revoke
 * @param {Object} revokeData - Revocation context
 * @returns {Object} - { success, internalRevoked, regulatoryRevoked, errors }
 */
export const revokePrescription = (
  internalPrescription,
  regulatoryDataset,
  revokeData = {}
) => {
  const result = {
    success: false,
    internalRevoked: null,
    regulatoryRevoked: null,
    errors: [],
  };

  // ===== VALIDATION =====
  if (!internalPrescription) {
    result.errors.push('Internal prescription is required');
    return result;
  }

  if (!regulatoryDataset) {
    result.errors.push('Regulatory dataset is required');
    return result;
  }

  // Cannot revoke draft prescriptions (not yet signed)
  if (!internalPrescription.signedRegisteredToken) {
    result.errors.push('Cannot revoke prescription that has not been signed/registered');
    return result;
  }

  if (internalPrescription.revokedAt) {
    result.errors.push('Prescription is already revoked');
    return result;
  }

  // ===== EXTRACT REVOCATION DATA =====
  const revokedBy = revokeData.revokedBy || revokeData.userId || '';
  const revokedReason = revokeData.reason || revokeData.revokedReason || 'Révoqué suite à requête';
  const revokedAt = revokeData.revokedAt || new Date().toISOString();
  const replacedByPrescriptionId =
    revokeData.replacedByPrescriptionId || revokeData.newPrescriptionId || null;

  try {
    // ===== MARK INTERNAL AS REVOKED =====
    const internalRevoked = markPrescriptionAsRevoked(internalPrescription, {
      revokedBy,
      revokedReason,
    });

    // Mark replacement if provided
    let finalInternal = internalRevoked;
    if (replacedByPrescriptionId) {
      finalInternal = markPrescriptionAsReplaced(internalRevoked, replacedByPrescriptionId);
    }

    // ===== MARK REGULATORY AS REVOKED =====
    const regulatoryRevoked = markAsRevoked(regulatoryDataset, {
      revokedAt,
      revokedReason,
      replacedByPrescriptionId,
    });

    result.success = true;
    result.internalRevoked = finalInternal;
    result.regulatoryRevoked = regulatoryRevoked;
  } catch (error) {
    result.errors.push(`Revocation error: ${error.message}`);
  }

  return result;
};

/**
 * Create revocation record for audit trail
 *
 * Use this to store revocation logs in database
 */
export const createRevocationRecord = ({
  prescriptionId = '',
  revokedBy = '',
  revokedAt = new Date().toISOString(),
  reason = '',
  replacedByPrescriptionId = null,
  signedToken = '',
  checksum = '',
} = {}) => {
  return {
    id: `revoke-${prescriptionId}-${Date.now()}`,
    prescriptionId,
    revokedBy,
    revokedAt,
    reason,
    replacedByPrescriptionId,

    // For audit trail
    signedToken: signedToken ? maskSensitiveToken(signedToken) : '',
    checksum: checksum ? maskChecksum(checksum) : '',

    // Metadata
    timestamp: new Date().toISOString(),
    type: 'PRESCRIPTION_REVOCATION',
  };
};

/**
 * Mask sensitive token for logging (show only first/last 4 chars)
 */
const maskSensitiveToken = (token) => {
  if (!token || token.length < 8) return '[MASKED]';
  const start = token.substring(0, 4);
  const end = token.substring(token.length - 4);
  const middle = '....';
  return `${start}${middle}${end}`;
};

/**
 * Mask checksum for logging
 */
const maskChecksum = (checksum) => {
  if (!checksum || checksum.length < 6) return '[MASKED]';
  return `${checksum.substring(0, 3)}...${checksum.substring(checksum.length - 3)}`;
};

/**
 * Validate that revocation is appropriate
 *
 * Returns { canRevoke: boolean, reason?: string }
 */
export const validateRevocationEligibility = (internalPrescription) => {
  if (!internalPrescription) {
    return { canRevoke: false, reason: 'Prescription not found' };
  }

  // Cannot revoke unsigned prescriptions
  if (!internalPrescription.signedRegisteredToken) {
    return {
      canRevoke: false,
      reason: 'Cannot revoke unsigned prescription',
    };
  }

  // Cannot revoke already-revoked prescriptions
  if (internalPrescription.revokedAt) {
    return {
      canRevoke: false,
      reason: 'Prescription is already revoked',
    };
  }

  // Check status for additional constraints
  const immutableStatuses = ['active', 'completed'];
  if (immutableStatuses.includes(internalPrescription.status)) {
    return {
      canRevoke: true,
      reason: 'Note: This prescription is already active or completed',
    };
  }

  return { canRevoke: true };
};

/**
 * Get default revocation reason based on context
 */
export const getDefaultRevocationReason = (context = {}) => {
  const reasons = {
    doctor_request: 'Révoqué suite à requête du prescripteur',
    patient_request: 'Révoqué suite à requête du patient',
    error_correction: 'Révoqué pour correction d\'erreur',
    medication_change: 'Révoqué - changement de traitement',
    clinical_reason: 'Révoqué pour raison clinique',
    administrative: 'Révoqué pour raison administrative',
    unknown: 'Révoqué',
  };

  return reasons[context.type || 'unknown'] || reasons.unknown;
};

/**
 * Prepare revocation audit log
 */
export const prepareRevocationAuditLog = ({
  internalPrescription,
  regulatoryDataset,
  revokedBy,
  reason,
  replacedByPrescriptionId,
} = {}) => {
  return {
    action: 'PRESCRIPTION_REVOKED',
    timestamp: new Date().toISOString(),

    prescription: {
      id: internalPrescription?.id,
      internalId: internalPrescription?.id,
      regulatoryId: regulatoryDataset?.InternalPrescriptionId,
    },

    details: {
      revokedBy,
      reason,
      replacedByPrescriptionId: replacedByPrescriptionId || null,
      previousStatus: internalPrescription?.status,
      signedToken: internalPrescription?.signedRegisteredToken
        ? maskSensitiveToken(internalPrescription.signedRegisteredToken)
        : null,
    },

    metadata: {
      prescriptionCreatedAt: internalPrescription?.creationDate,
      wasActive: internalPrescription?.status === 'active',
      hadMedications: (internalPrescription?.medications || []).length,
    },
  };
};
