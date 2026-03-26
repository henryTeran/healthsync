/**
 * Sign and Register Prescription Use Case
 *
 * Orchestrates the signing and registration of a prescription with the E-Rezept service.
 *
 * Responsibilities:
 * - Validate prescription is ready for signing
 * - Call E-Rezept service (or mock)
 * - Store signed token and registration data
 * - Update prescription status
 * - Persist both internal and regulatory datasets
 * - Handle service errors gracefully
 *
 * This is a CRITICAL use case - signature is permanent and immutable
 */

import {
  markAsSignedAndRegistered,
  validateSignedAndRegistered,
  updateInternalPrescription,
  APPLICATION_WORKFLOW,
  validateNotAlreadySigned,
  transformInternalToRegulatoryDataset,
} from '../domain/index.js';

import { logDebug, logError, logWarn } from '../../../shared/lib/logger.js';

/**
 * Sign and register a prescription with E-Rezept service
 *
 * @param {Object} input
 * @param {Object} input.internalPrescription - Prescription to sign
 * @param {Object} input.patientProfile - Patient data
 * @param {Object} input.prescriberProfile - Doctor data
 * @param {Function} input.erezeptService - E-Rezept service call function
 * @param {Function} input.persistInternal - Repository to save internal prescription
 * @param {Function} input.persistRegulatory - Repository to save regulatory dataset
 * @returns {Promise<Object>} - { success, internalSigned, regulatorySigned, errors }
 */
export const signAndRegisterPrescriptionUseCase = async (
  input = {},
  options = {}
) => {
  const result = {
    success: false,
    internalSigned: null,
    regulatorySigned: null,
    registrationId: null,
    signedToken: null,
    errors: [],
  };

  // ===== INPUT VALIDATION =====
  if (!input.internalPrescription) {
    result.errors.push('Internal prescription is required');
    return result;
  }

  if (!input.patientProfile || !input.prescriberProfile) {
    result.errors.push('Patient and prescriber profiles are required');
    return result;
  }

  if (!input.erezeptService || typeof input.erezeptService !== 'function') {
    result.errors.push('E-Rezept service function is required');
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

  try {
    logDebug('Starting sign and register use case', {
      feature: 'prescriptions',
      action: 'signAndRegisterUseCase',
      prescriptionId: input.internalPrescription.id,
    });

    // ===== PRE-SIGN CHECKS =====
    const notSignedCheck = validateNotAlreadySigned(input.internalPrescription);
    if (!notSignedCheck.isValid) {
      result.errors.push('Prescription is already signed');
      return result;
    }

    // ===== TRANSFORM TO REGULATORY DATASET =====
    const transformResult = transformInternalToRegulatoryDataset(
      input.internalPrescription,
      input.patientProfile,
      input.prescriberProfile,
      options.transformationDefaults
    );

    if (!transformResult.success) {
      result.errors.push(`Transformation failed: ${transformResult.errors.join(', ')}`);
      logError('Transformation failed during signing', new Error(result.errors[0]), {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
      });
      return result;
    }

    let regulatoryDataset = transformResult.dataset;

    logDebug('Regulatory dataset created', {
      feature: 'prescriptions',
      action: 'signAndRegisterUseCase',
      prescriptionId: input.internalPrescription.id,
      patientId: input.patientProfile.id,
    });

    // ===== CALL E-REZEPT SERVICE =====
    let serviceResult;
    try {
      serviceResult = await input.erezeptService(regulatoryDataset, options.serviceOptions);

      logDebug('E-Rezept service called', {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
        registrationId: serviceResult.registrationId,
      });
    } catch (serviceError) {
      result.errors.push(`E-Rezept service error: ${serviceError.message}`);
      logError('E-Rezept service call failed', serviceError, {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
        prescriptionId: input.internalPrescription.id,
      });

      // If service fails, don't mark as signed
      return result;
    }

    // Service MUST return: { registrationId, signedToken, timestamp }
    if (!serviceResult.registrationId || !serviceResult.signedToken) {
      result.errors.push('Invalid service response - missing registrationId or signedToken');
      return result;
    }

    result.registrationId = serviceResult.registrationId;
    result.signedToken = serviceResult.signedToken;

    // ===== MARK REGULATORY DATASET AS SIGNED =====
    regulatoryDataset = markAsSignedAndRegistered(regulatoryDataset, {
      registrationId: serviceResult.registrationId,
      signedToken: serviceResult.signedToken,
      serviceSignature: serviceResult.serviceSignature || '',
      checksumDataset: serviceResult.checksumDataset || '',
      registrationTimestamp: serviceResult.timestamp || new Date().toISOString(),
    });

    // Validate signed dataset
    const signedValidation = validateSignedAndRegistered(regulatoryDataset);
    if (!signedValidation.isValid) {
      result.errors.push(`Signed dataset validation failed: ${signedValidation.getErrorMessages().join(', ')}`);
      logError('Signed dataset validation failed', new Error(result.errors[0]), {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
      });
      return result;
    }

    // ===== UPDATE INTERNAL PRESCRIPTION =====
    const internalSigned = updateInternalPrescription(
      input.internalPrescription,
      {
        status: APPLICATION_WORKFLOW.PDF_GENERATED, // Next workflow step
        signedRegisteredToken: serviceResult.signedToken,
        regulatoryDatasetId: regulatoryDataset.InternalPrescriptionId,
        metadata: {
          ...input.internalPrescription.metadata,
          signedAt: new Date().toISOString(),
          registrationId: serviceResult.registrationId,
        },
      }
    );

    // ===== PERSIST INTERNAL PRESCRIPTION =====
    try {
      result.internalSigned = await input.persistInternal(internalSigned);
      logDebug('Internal prescription signed and persisted', {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
        prescriptionId: result.internalSigned.id,
      });
    } catch (persistError) {
      result.errors.push(`Failed to persist signed prescription: ${persistError.message}`);
      logError('Internal persistence failed', persistError, {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
      });
      return result;
    }

    // ===== PERSIST REGULATORY DATASET =====
    try {
      result.regulatorySigned = await input.persistRegulatory(regulatoryDataset);
      logDebug('Regulatory dataset signed and persisted', {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
        regulatoryId: result.regulatorySigned.Id,
      });
    } catch (persistError) {
      logWarn('Regulatory dataset persistence failed (but internal was persisted)', persistError, {
        feature: 'prescriptions',
        action: 'signAndRegisterUseCase',
      });
      // Don't fail completely - we have the signature, just couldn't archive regulatory
      // The internal prescription has the token so we can recover
    }

    // ===== SUCCESS =====
    result.success = true;
    logDebug('Sign and register completed successfully', {
      feature: 'prescriptions',
      action: 'signAndRegisterUseCase',
      prescriptionId: result.internalSigned.id,
      registrationId: result.registrationId,
    });
  } catch (error) {
    result.errors.push(`Use case error: ${error.message}`);
    logError('Sign and register use case failed', error, {
      feature: 'prescriptions',
      action: 'signAndRegisterUseCase',
    });
  }

  return result;
};

/**
 * Get human-readable signing result summary
 */
export const getSigningResultSummary = (result) => {
  if (!result) return 'No result';

  if (!result.success) {
    return `Signature échouée: ${result.errors.join('; ')}`;
  }

  return `Ordonnance signée avec succès\nID d'enregistrement: ${result.registrationId}\nToken: ${maskToken(result.signedToken)}`;
};

/**
 * Mask token for display
 */
const maskToken = (token) => {
  if (!token || token.length < 8) return '[MASKED]';
  const start = token.substring(0, 6);
  const end = token.substring(token.length - 6);
  return `${start}...${end}`;
};
