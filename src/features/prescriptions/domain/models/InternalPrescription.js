/**
 * Internal Prescription Model
 * 
 * Represents a prescription in HealthSync's internal format (clinical data, app statuses).
 * Distinct from regulatory/CHMED16A dataset.
 * 
 * This is the source of truth for:
 * - Clinical information
 * - Patient tracking workflow
 * - Internal statuses
 */

import { APPLICATION_WORKFLOW } from './PrescriptionStatuses.js';

/**
 * Create an internal HealthSync prescription
 */
export const createInternalPrescription = ({
  // ==== IDENTIFICATION ====
  id = '', // Firestore doc ID
  
  // ==== CREATION ====
  createdBy = '', // userId of prescriber/doctor
  patientId = '', // Patient this prescription is for
  creationDate = new Date().toISOString(),
  
  // ==== APPLICATION WORKFLOW STATUS ====
  status = APPLICATION_WORKFLOW.DRAFT,
  
  // ==== CLINICAL DATA ====
  clinicalInfo = {
    diagnosis: '',
    allergies: [], // array of known allergies
    contraindications: [], // array of contraindications
    notes: '',
  },
  
  // ==== INTERNAL MEDICATIONS (HealthSync model) ====
  // Different from regulatory medications
  medications = [], // Array of internal medication objects
  
  // ==== REGULATORY REFERENCE ====
  regulatoryDatasetId = null, // Link to RegulatoryDataset when created
  signedRegisteredToken = null, // Set after service registration
  
  // ==== REVOCATION CHAIN ====
  revokedAt = null,
  revokedBy = null, // userId who revoked this
  revocationReason = null,
  replacedByPrescriptionId = null, // If this was revoked, the new prescription
  
  // ==== METADATA ====
  validation = null, // { isValid: boolean, errors: [] }
  metadata = {},
  
  // ==== TIMESTAMPS ====
  updatedAt = null,
} = {}) => {
  const now = new Date().toISOString();
  
  const prescription = {
    // Identification
    id,
    createdBy,
    patientId,
    creationDate,
    
    // Status
    status,
    
    // Clinical
    clinicalInfo: {
      diagnosis: clinicalInfo?.diagnosis || '',
      allergies: Array.isArray(clinicalInfo?.allergies) ? clinicalInfo.allergies : [],
      contraindications: Array.isArray(clinicalInfo?.contraindications) ? clinicalInfo.contraindications : [],
      notes: clinicalInfo?.notes || '',
    },
    
    // Medications (internal)
    medications: Array.isArray(medications) ? medications : [],
    
    // Regulatory link
    regulatoryDatasetId,
    signedRegisteredToken,
    
    // Revocation
    revokedAt,
    revokedBy,
    revocationReason,
    replacedByPrescriptionId,
    
    // Metadata
    validation: validation || { isValid: false, errors: [] },
    metadata: metadata || {},
    
    // Timestamps
    updatedAt: updatedAt || now,
  };
  
  return Object.freeze(prescription);
};

/**
 * Create a draft internal prescription (minimal)
 */
export const createDraftPrescription = ({
  id = '',
  createdBy = '',
  patientId = '',
}) => {
  return createInternalPrescription({
    id,
    createdBy,
    patientId,
    status: APPLICATION_WORKFLOW.DRAFT,
  });
};

/**
 * Update an internal prescription (returns new frozen object)
 */
export const updateInternalPrescription = (
  prescription,
  updates = {}
) => {
  if (!prescription) {
    throw new Error('Prescription is required');
  }
  
  return createInternalPrescription({
    // Copy existing
    id: prescription.id,
    createdBy: prescription.createdBy,
    patientId: prescription.patientId,
    creationDate: prescription.creationDate,
    
    status: updates.status || prescription.status,
    clinicalInfo: updates.clinicalInfo || prescription.clinicalInfo,
    medications: updates.medications || prescription.medications,
    regulatoryDatasetId: updates.regulatoryDatasetId ?? prescription.regulatoryDatasetId,
    signedRegisteredToken: updates.signedRegisteredToken || prescription.signedRegisteredToken,
    
    revokedAt: updates.revokedAt ?? prescription.revokedAt,
    revokedBy: updates.revokedBy || prescription.revokedBy,
    revocationReason: updates.revocationReason || prescription.revocationReason,
    replacedByPrescriptionId: updates.replacedByPrescriptionId || prescription.replacedByPrescriptionId,
    
    validation: updates.validation || prescription.validation,
    metadata: { ...prescription.metadata, ...updates.metadata },
    
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Mark prescription as revoked (immutable)
 */
export const markPrescriptionAsRevoked = (
  prescription,
  {
    revokedBy = '',
    revokedReason = 'Révoqué suite à requête',
  }
) => {
  return updateInternalPrescription(prescription, {
    status: APPLICATION_WORKFLOW.CANCELLED,
    revokedAt: new Date().toISOString(),
    revokedBy,
    revocationReason: revokedReason,
  });
};

/**
 * Mark prescription as replaced by another
 */
export const markPrescriptionAsReplaced = (
  prescription,
  newPrescriptionId
) => {
  return updateInternalPrescription(prescription, {
    replacedByPrescriptionId: newPrescriptionId,
  });
};

/**
 * Validate internal prescription structure
 * Returns array of error messages
 */
export const validateInternalPrescription = (prescription) => {
  const errors = [];
  
  if (!prescription) {
    errors.push('Prescription object is required');
    return errors;
  }
  
  if (!prescription.id) {
    errors.push('Prescription ID is required');
  }
  
  if (!prescription.createdBy) {
    errors.push('Creator (prescriber) is required');
  }
  
  if (!prescription.patientId) {
    errors.push('Patient ID is required');
  }
  
  if (!prescription.status) {
    errors.push('Status is required');
  }
  
  if (!Array.isArray(prescription.medications) || prescription.medications.length === 0) {
    errors.push('At least one medication is required');
  }
  
  if (prescription.clinicalInfo) {
    if (!prescription.clinicalInfo.diagnosis || prescription.clinicalInfo.diagnosis.trim().length === 0) {
      errors.push('Diagnosis is required in clinical info');
    }
  }
  
  return errors;
};

/**
 * Check if prescription is mutable (can be edited)
 */
export const isPrescriptionMutable = (prescription) => {
  const immutableStatuses = new Set([
    APPLICATION_WORKFLOW.PDF_GENERATED,
    APPLICATION_WORKFLOW.SENT,
    APPLICATION_WORKFLOW.RECEIVED,
    APPLICATION_WORKFLOW.VALIDATED_BY_PATIENT,
    APPLICATION_WORKFLOW.ACTIVE,
    APPLICATION_WORKFLOW.COMPLETED,
  ]);
  
  return !immutableStatuses.has(prescription?.status);
};

/**
 * Convert internal medication to regulatory medication
 * (Helper for transformation layer)
 */
export const prepareInternalMedicationForRegulation = (internalMed) => {
  return {
    medicationCode: internalMed.id || internalMed.medicationCode,
    codeType: internalMed.codeType || 'Pharmaindex',
    
    name: internalMed.name,
    dosage: internalMed.dosage,
    form: internalMed.form || internalMed.pharmaceuticalForm,
    
    posology: internalMed.posology,
    frequency: internalMed.frequency,
    duration: internalMed.duration,
    
    quantity: internalMed.quantity || 1,
    unit: internalMed.unit || 'mg',
    
    applicationInstructions: internalMed.applicationInstructions || '',
    repeatMonths: internalMed.repeatMonths || 0,
    substitutionForbidden: internalMed.substitutionForbidden || false,
    substitutionReason: internalMed.substitutionReason || '',
    patientInstruction: internalMed.patientInstruction || '',
    
    controlledSubstance: internalMed.controlledSubstance || internalMed.isNarcotic || false,
  };
};
