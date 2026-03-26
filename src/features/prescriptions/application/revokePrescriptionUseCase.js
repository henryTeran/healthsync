/**
 * Revoke Prescription Use Case
 *
 * Orchestrates the revocation of a signed prescription.
 * Handles both internal and regulatory datasets.
 * Creates full audit trail.
 *
 * Important: Revocation is PERMANENT and IMMUTABLE
 * Cannot be undone - only replaced by creation of new prescription
 */

import {
  revokePrescription,
  createRevocationRecord,
  validateRevocationEligibility,
  prepareRevocationAuditLog,
} from '../domain/index.js';

import {
  logDebug,
  logError,
  logWarn,
} from '../../../shared/lib/logger.js';

/**
 * Revoke a signed prescription
 *
 * @param {Object} input
 * @param {Object} input.internalPrescription - The prescription to revoke
 * @param {Object} input.regulatoryDataset - The regulatory dataset to revoke
 * @param {string} input.revokedBy - User ID of person revoking
 * @param {string} input.reason - Reason for revocation
 * @param {Function} input.persistInternal - Repository to save revoked internal
 * @param {Function} input.persistRegulatory - Repository to save revoked regulatory
 * @param {Function} input.persistAuditLog - Repository to save audit trail
 * @returns {Promise<Object>} - { success, internalRevoked, regulatoryRevoked, auditRecord, errors }
 */
export const revokePrescriptionUseCase = async (
  input = {},
  options = {}
) => {
  const result = {
    success: false,
    internalRevoked: null,
    regulatoryRevoked: null,
    auditRecord: null,
    errors: [],
  };

  // ===== INPUT VALIDATION =====
  if (!input.internalPrescription) {
    result.errors.push('Internal prescription is required');
    return result;
  }

  if (!input.regulatoryDataset) {
    result.errors.push('Regulatory dataset is required');
    return result;
  }

  if (!input.revokedBy) {
    result.errors.push('User ID (revokedBy) is required');
    return result;
  }

  if (!input.persistInternal || typeof input.persistInternal !== 'function') {
    result.errors.push('Internal persistence function is required');
    return result;
  }

  if (!input.persistRegulatory || typeof input.persistRegulatory !== 'function') {
    result.errors.push('Regulatory persistence function is required');
    return result;
  }

  if (!input.persistAuditLog || typeof input.persistAuditLog !== 'function') {
    result.errors.push('Audit log persistence function is required');
    return result;
  }

  try {
    logDebug('Starting revocation use case', {
      feature: 'prescriptions',
      action: 'revokePrescriptionUseCase',
      prescriptionId: input.internalPrescription.id,
      revokedBy: input.revokedBy,
    });

    // ===== CHECK REVOCATION ELIGIBILITY =====
    const eligibility = validateRevocationEligibility(input.internalPrescription);
    if (!eligibility.canRevoke) {
      result.errors.push(`Cannot revoke: ${eligibility.reason}`);
      logWarn('Revocation not eligible', new Error(eligibility.reason), {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
        prescriptionId: input.internalPrescription.id,
      });
      return result;
    }

    // ===== PERFORM REVOCATION =====
    const revocationResult = revokePrescription(
      input.internalPrescription,
      input.regulatoryDataset,
      {
        revokedBy: input.revokedBy,
        reason: input.reason || 'Révoqué suite à requête',
        revokedAt: options.revokedAt || new Date().toISOString(),
        replacedByPrescriptionId: options.replacedByPrescriptionId || null,
      }
    );

    if (!revocationResult.success) {
      result.errors.push(...revocationResult.errors);
      logError('Revocation failed', new Error(revocationResult.errors[0]), {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
      });
      return result;
    }

    result.internalRevoked = revocationResult.internalRevoked;
    result.regulatoryRevoked = revocationResult.regulatoryRevoked;

    logDebug('Revocation created (objects immutable)', {
      feature: 'prescriptions',
      action: 'revokePrescriptionUseCase',
      prescriptionId: input.internalPrescription.id,
    });

    // ===== CREATE AUDIT RECORD =====
    const auditLog = prepareRevocationAuditLog({
      internalPrescription: input.internalPrescription,
      regulatoryDataset: input.regulatoryDataset,
      revokedBy: input.revokedBy,
      reason: input.reason || 'Révoqué suite à requête',
      replacedByPrescriptionId: options.replacedByPrescriptionId,
    });

    const revocationRecord = createRevocationRecord({
      prescriptionId: input.internalPrescription.id,
      revokedBy: input.revokedBy,
      revokedAt: options.revokedAt || new Date().toISOString(),
      reason: input.reason || 'Révoqué suite à requête',
      replacedByPrescriptionId: options.replacedByPrescriptionId || null,
      signedToken: input.internalPrescription.signedRegisteredToken,
      checksum: input.regulatoryDataset.Auth?.ChecksumDataset,
    });

    // ===== PERSIST REVOKED INTERNAL PRESCRIPTION =====
    try {
      result.internalRevoked = await input.persistInternal(result.internalRevoked);
      logDebug('Revoked internal prescription persisted', {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
        prescriptionId: result.internalRevoked.id,
      });
    } catch (persistError) {
      result.errors.push(`Failed to persist revoked prescription: ${persistError.message}`);
      logError('Internal persistence failed', persistError, {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
      });
      return result;
    }

    // ===== PERSIST REVOKED REGULATORY DATASET =====
    try {
      result.regulatoryRevoked = await input.persistRegulatory(result.regulatoryRevoked);
      logDebug('Revoked regulatory dataset persisted', {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
      });
    } catch (persistError) {
      logWarn('Regulatory dataset persistence failed', persistError, {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
      });
      // Don't fail - internal is persisted which is the critical part
    }

    // ===== PERSIST AUDIT LOG =====
    try {
      result.auditRecord = await input.persistAuditLog(auditLog);
      logDebug('Audit log persisted', {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
        auditId: result.auditRecord.id,
      });
    } catch (persistError) {
      logWarn('Audit log persistence failed', persistError, {
        feature: 'prescriptions',
        action: 'revokePrescriptionUseCase',
      });
      // Don't fail - main data is already persisted
    }

    // ===== SUCCESS =====
    result.success = true;
    logDebug('Revocation completed successfully', {
      feature: 'prescriptions',
      action: 'revokePrescriptionUseCase',
      prescriptionId: input.internalPrescription.id,
      revokedAt: options.revokedAt,
    });
  } catch (error) {
    result.errors.push(`Use case error: ${error.message}`);
    logError('Revoke prescription use case failed', error, {
      feature: 'prescriptions',
      action: 'revokePrescriptionUseCase',
    });
  }

  return result;
};

/**
 * Get human-readable revocation result summary
 */
export const getRevocationSummary = (result) => {
  if (!result) return 'No result';

  if (!result.success) {
    return `Révocation échouée: ${result.errors.join('; ')}`;
  }

  if (result.internalRevoked?.replacedByPrescriptionId) {
    return `Ordonnance révoquée et remplacée par: ${result.internalRevoked.replacedByPrescriptionId}`;
  }

  return `Ordonnance révoquée avec succès le ${new Date(result.internalRevoked?.revokedAt).toLocaleDateString('fr-CH')}`;
};
