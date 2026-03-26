/**
 * Create Prescription Use Case
 *
 * Orchestrates the creation of a new prescription in HealthSync.
 *
 * Responsibilities:
 * - Validate input data
 * - Create internal prescription object
 * - Run business logic validation
 * - Persist to database
 * - Return result with status
 *
 * Does NOT sign or register (that's Phase 2 of workflow)
 */

import {
  createInternalPrescription,
  validatePrescriptionBusiness,
  APPLICATION_WORKFLOW,
  VALIDATION_LAYER,
} from '../domain/index.js';

import { logDebug, logError } from '../../../shared/lib/logger.js';

/**
 * Create a new prescription
 *
 * @param {Object} input
 * @param {string} input.patientId - Patient ID
 * @param {string} input.createdBy - Doctor/Prescriber user ID
 * @param {Object} input.clinicalInfo - Clinical data (diagnosis, allergies, notes)
 * @param {Array} input.medications - Array of medication objects
 * @param {Function} input.persistRepository - Firebase repository save function
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} - { success, prescription, validations, errors }
 */
export const createPrescriptionUseCase = async (
  input = {},
  options = {}
) => {
  const result = {
    success: false,
    prescription: null,
    validations: {
      business: null,
      combined: null,
    },
    errors: [],
  };

  // ===== INPUT VALIDATION =====
  if (!input.patientId) {
    result.errors.push('Patient ID is required');
    return result;
  }

  if (!input.createdBy) {
    result.errors.push('Creator (doctor) ID is required');
    return result;
  }

  if (!Array.isArray(input.medications) || input.medications.length === 0) {
    result.errors.push('At least one medication is required');
    return result;
  }

  if (!input.persistRepository || typeof input.persistRepository !== 'function') {
    result.errors.push('Persist repository function is required');
    return result;
  }

  try {
    // ===== CREATE PRESCRIPTION OBJECT =====
    const internalPrescription = createInternalPrescription({
      id: options.prescriptionId || `rx-${Date.now()}`, // Will be overwritten by Firestore
      createdBy: input.createdBy,
      patientId: input.patientId,
      status: APPLICATION_WORKFLOW.DRAFT,
      clinicalInfo: {
        diagnosis: input.clinicalInfo?.diagnosis || '',
        allergies: input.clinicalInfo?.allergies || [],
        contraindications: input.clinicalInfo?.contraindications || [],
        notes: input.clinicalInfo?.notes || '',
      },
      medications: input.medications,
      validation: null, // Will be filled after validation
      metadata: input.metadata || {},
    });

    logDebug('Prescription object created', {
      feature: 'prescriptions',
      action: 'createPrescriptionUseCase',
      prescriptionId: internalPrescription.id,
      patientId: input.patientId,
      medicationCount: input.medications.length,
    });

    // ===== BUSINESS VALIDATION =====
    // (No structural validation phase - object is created valid with factory pattern)
    const businessValidation = validatePrescriptionBusiness(internalPrescription);
    result.validations.business = businessValidation;

    // Update prescription with validation result
    const validatedPrescription = {
      ...internalPrescription,
      validation: {
        isValid: businessValidation.isValid,
        errors: businessValidation.errors,
        warnings: businessValidation.warnings,
        validatedAt: new Date().toISOString(),
      },
    };

    // ===== PERSIST TO DATABASE =====
    let persistedPrescription;
    try {
      persistedPrescription = await input.persistRepository(validatedPrescription);
      
      logDebug('Prescription persisted', {
        feature: 'prescriptions',
        action: 'createPrescriptionUseCase',
        prescriptionId: persistedPrescription.id,
        status: persistedPrescription.status,
      });
    } catch (persistError) {
      result.errors.push(`Failed to persist prescription: ${persistError.message}`);
      logError('Persistence failed', persistError, {
        feature: 'prescriptions',
        action: 'createPrescriptionUseCase',
      });
      return result;
    }

    // ===== SUCCESS =====
    result.success = true;
    result.prescription = persistedPrescription;

    logDebug('Prescription created successfully', {
      feature: 'prescriptions',
      action: 'createPrescriptionUseCase',
      prescriptionId: persistedPrescription.id,
      status: APPLICATION_WORKFLOW.DRAFT,
      warnings: result.validations.business.warnings?.length || 0,
    });
  } catch (error) {
    result.errors.push(`Use case error: ${error.message}`);
    logError('Create prescription use case failed', error, {
      feature: 'prescriptions',
      action: 'createPrescriptionUseCase',
    });
  }

  return result;
};

/**
 * Get human-readable summary of creation result
 */
export const getCreatePrescriptionSummary = (result) => {
  if (!result) return 'No result';

  if (!result.success) {
    return `Création échouée: ${result.errors.join('; ')}`;
  }

  const warnings = result.validations.business?.warnings?.length || 0;
  const warningText = warnings > 0 ? ` (${warnings} avertissements)` : '';

  return `Prescription créée avec succès${warningText}: ${result.prescription?.id}`;
};
