/**
 * Validate Prescription Use Case
 *
 * Performs comprehensive validation at all layers before signature/registration.
 * Separate from create because validation can be run independently on existing prescriptions.
 *
 * Responsibilities:
 * - UI/form level validation
 * - Business logic validation
 * - Regulatory conformance validation (transforms to regulatory dataset first)
 * - Returns detailed errors at each layer
 */

import {
  validateInternalPrescription,
  validatePrescriptionBusiness,
  validateNotAlreadySigned,
  combineValidationResults,
} from '../domain/index.js';

import {
  validateReadyForSigning,
} from '../domain/index.js';

import {
  transformInternalToRegulatoryDataset,
} from '../domain/index.js';

import {
  createValidationResult,
  VALIDATION_LAYER,
} from '../domain/index.js';

import { logDebug, logError } from '../../../shared/lib/logger.js';

/**
 * Validate a prescription at all layers before signing
 *
 * @param {Object} input
 * @param {Object} input.internalPrescription - The prescription to validate
 * @param {Object} input.patientProfile - Patient data (for regulatory transformation)
 * @param {Object} input.prescriberProfile - Doctor data (for regulatory transformation)
 * @returns {Promise<Object>} - { success, validations, dataset, errors }
 */
export const validatePrescriptionUseCase = async (
  input = {},
  options = {}
) => {
  const result = {
    success: false,
    validations: {
      structural: null,
      business: null,
      notAlreadySigned: null,
      regulatory: null,
      combined: null,
    },
    dataset: null,
    errors: [],
  };

  // ===== INPUT VALIDATION =====
  if (!input.internalPrescription) {
    result.errors.push('Internal prescription is required');
    return result;
  }

  if (!input.patientProfile) {
    result.errors.push('Patient profile is required for regulatory validation');
    return result;
  }

  if (!input.prescriberProfile) {
    result.errors.push('Prescriber profile is required for regulatory validation');
    return result;
  }

  try {
    logDebug('Starting prescription validation', {
      feature: 'prescriptions',
      action: 'validatePrescriptionUseCase',
      prescriptionId: input.internalPrescription.id,
    });

    // ===== LAYER 1: STRUCTURAL VALIDATION =====
    const structuralErrors = validateInternalPrescription(input.internalPrescription);
    const structuralValidation = createValidationResult({
      isValid: structuralErrors.length === 0,
      errors: structuralErrors.map(err => ({
        code: 'STRUCTURAL_ERROR',
        message: err,
        layer: VALIDATION_LAYER.UI,
        severity: 'error',
      })),
      layer: VALIDATION_LAYER.UI,
    });
    result.validations.structural = structuralValidation;

    if (!structuralValidation.isValid) {
      result.errors.push('Structural validation failed');
      return result;
    }

    // ===== LAYER 2: BUSINESS LOGIC VALIDATION =====
    const businessValidation = validatePrescriptionBusiness(input.internalPrescription);
    result.validations.business = businessValidation;

    // ===== CHECK NOT ALREADY SIGNED =====
    const notSignedValidation = validateNotAlreadySigned(input.internalPrescription);
    result.validations.notAlreadySigned = notSignedValidation;

    if (!notSignedValidation.isValid) {
      result.errors.push('Prescription is already signed - cannot validate for re-signing');
      return result;
    }

    // ===== LAYER 3: REGULATORY VALIDATION =====
    // Must transform to regulatory dataset first
    const transformResult = transformInternalToRegulatoryDataset(
      input.internalPrescription,
      input.patientProfile,
      input.prescriberProfile,
      options.transformationDefaults
    );

    if (!transformResult.success) {
      result.errors.push(`Transformation to regulatory dataset failed: ${transformResult.errors.join(', ')}`);
      logError('Regulatory transformation failed', new Error(result.errors[0]), {
        feature: 'prescriptions',
        action: 'validatePrescriptionUseCase',
      });
      return result;
    }

    result.dataset = transformResult.dataset;

    // Validate the transformed regulatory dataset
    const regulatoryValidation = validateReadyForSigning(transformResult.dataset);
    result.validations.regulatory = regulatoryValidation;

    if (!regulatoryValidation.isValid) {
      result.errors.push(`Regulatory validation failed: ${regulatoryValidation.getErrorMessages().join('; ')}`);
      logError('Regulatory validation failed', new Error(result.errors[0]), {
        feature: 'prescriptions',
        action: 'validatePrescriptionUseCase',
      });
      return result;
    }

    // ===== COMBINE ALL VALIDATIONS =====
    result.validations.combined = combineValidationResults(
      structuralValidation,
      businessValidation
    );

    // Add regulatory results to combined
    if (regulatoryValidation.warnings.length > 0) {
      regulatoryValidation.warnings.forEach(w => {
        result.validations.combined.warnings.push(w);
      });
    }

    result.success = result.validations.combined.isValid && regulatoryValidation.isValid;

    logDebug('Prescription validation completed', {
      feature: 'prescriptions',
      action: 'validatePrescriptionUseCase',
      prescriptionId: input.internalPrescription.id,
      success: result.success,
      errors: result.validations.combined.errorCount,
      warnings: result.validations.combined.warningCount,
    });
  } catch (error) {
    result.errors.push(`Validation use case error: ${error.message}`);
    logError('Validate prescription use case failed', error, {
      feature: 'prescriptions',
      action: 'validatePrescriptionUseCase',
    });
  }

  return result;
};

/**
 * Get human-readable validation summary
 */
export const getValidationSummary = (result) => {
  if (!result) return 'No validation result';

  if (!result.success) {
    const errors = result.errors.join('\n• ');
    return `Validation échouée:\n• ${errors}`;
  }

  const errorCount = result.validations.combined?.errorCount || 0;
  const warningCount = result.validations.combined?.warningCount || 0;

  if (errorCount > 0) {
    return `Validation échouée: ${errorCount} erreur(s)`;
  }

  if (warningCount > 0) {
    return `Validation réussie avec ${warningCount} avertissement(s)`;
  }

  return 'Validation réussie - Prêt pour signature';
};
