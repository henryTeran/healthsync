/**
 * Business Validator
 * 
 * Validates prescription against business logic and application rules.
 * Works on internal prescription data (UI/form level and initial business checks).
 * 
 * This is Layer 2 validation (after UI form-level checks).
 */

import {
  createValidationResult,
  VALIDATION_LAYER,
  BUSINESS_ERRORS,
  ERROR_SEVERITY,
} from './ValidationErrors.js';

/**
 * Validate business logic of internal prescription
 */
export const validatePrescriptionBusiness = (internalPrescription) => {
  let result = createValidationResult({
    isValid: true,
    layer: VALIDATION_LAYER.BUSINESS,
  });
  
  if (!internalPrescription) {
    return result.addError(
      BUSINESS_ERRORS.DIAGNOSIS_MISSING,
      'Prescription is required'
    );
  }
  
  // ===== DIAGNOSIS VALIDATION =====
  const clinicalInfo = internalPrescription.clinicalInfo || {};
  
  if (!clinicalInfo.diagnosis || String(clinicalInfo.diagnosis).trim().length === 0) {
    result = result.addError(
      BUSINESS_ERRORS.DIAGNOSIS_MISSING,
      'Diagnosis is required for prescription'
    );
  } else if (String(clinicalInfo.diagnosis).trim().length < 3) {
    result = result.addError(
      BUSINESS_ERRORS.DIAGNOSIS_MISSING,
      'Diagnosis must be at least 3 characters'
    );
  }
  
  // ===== MEDICATIONS VALIDATION =====
  const medications = internalPrescription.medications || [];
  
  if (!Array.isArray(medications) || medications.length === 0) {
    result = result.addError(
      BUSINESS_ERRORS.MEDICATION_INCOMPATIBLE,
      'At least one medication is required'
    );
  } else {
    // Validate each medication
    medications.forEach((med, idx) => {
      if (!med.name || String(med.name).trim().length === 0) {
        result = result.addError(
          BUSINESS_ERRORS.MEDICATION_STRUCTURE_INVALID,
          `Medication ${idx + 1}: Name is required`,
          { medicationIndex: idx }
        );
      }
      
      if (!med.dosage || String(med.dosage).trim().length === 0) {
        result = result.addError(
          BUSINESS_ERRORS.MEDICATION_STRUCTURE_INVALID,
          `Medication ${idx + 1}: Dosage is required`,
          { medicationIndex: idx }
        );
      }
      
      if (!med.frequency || String(med.frequency).trim().length === 0) {
        result = result.addError(
          BUSINESS_ERRORS.MEDICATION_STRUCTURE_INVALID,
          `Medication ${idx + 1}: Frequency is required`,
          { medicationIndex: idx }
        );
      }
      
      if (!med.duration || String(med.duration).trim().length === 0) {
        result = result.addError(
          BUSINESS_ERRORS.MEDICATION_STRUCTURE_INVALID,
          `Medication ${idx + 1}: Duration is required`,
          { medicationIndex: idx }
        );
      }
    });
  }
  
  // ===== ALLERGY CHECKS (warning level) =====
  if (Array.isArray(clinicalInfo.allergies) && clinicalInfo.allergies.length > 0) {
    const medicineNames = medications.map(m => (m.name || '').toLowerCase());
    const allergyConflicts = clinicalInfo.allergies.filter(allergy =>
      medicineNames.some(name => name.includes(String(allergy).toLowerCase()))
    );
    
    if (allergyConflicts.length > 0) {
      result = result.addWarning(
        BUSINESS_ERRORS.MEDICATION_ALLERGIC_REACTION,
        `Possible allergy conflict detected: ${allergyConflicts.join(', ')}`,
        { conflicts: allergyConflicts }
      );
    }
  }
  
  // ===== CONTRAINDICATION CHECKS (warning level) =====
  if (Array.isArray(clinicalInfo.contraindications) && clinicalInfo.contraindications.length > 0) {
    const medicineNames = medications.map(m => (m.name || '').toLowerCase());
    const contraindicationMatches = clinicalInfo.contraindications.filter(contra =>
      medicineNames.some(name => name.includes(String(contra).toLowerCase()))
    );
    
    if (contraindicationMatches.length > 0) {
      result = result.addWarning(
        BUSINESS_ERRORS.MEDICATION_CONTRAINDICATED,
        `Possible contraindication with: ${contraindicationMatches.join(', ')}`,
        { contraindications: contraindicationMatches }
      );
    }
  }
  
  // ===== REPETITION/DURATION COHERENCE =====
  const hasLongDuration = medications.some(m => {
    const durationLower = String(m.duration || '').toLowerCase();
    return durationLower.includes('mois') || durationLower.includes('an');
  });
  
  if (hasLongDuration && medications.length === 1) {
    const med = medications[0];
    const durationDays = parseDurationToDays(med.duration);
    
    // If long-term, should have repetition info
    if (durationDays > 90 && !med.repeatMonths) {
      result = result.addWarning(
        BUSINESS_ERRORS.DURATION_INVALID,
        'Long-term prescription should specify repetition months',
        { durationDays }
      );
    }
  }
  
  return result;
};

/**
 * Validate that prescription can be modified (not immutable)
 */
export const validatePrescriptionMutable = (internalPrescription) => {
  let result = createValidationResult({
    isValid: true,
    layer: VALIDATION_LAYER.BUSINESS,
  });
  
  if (!internalPrescription) {
    return result.addError(
      BUSINESS_ERRORS.PRESCRIPTION_IMMUTABLE,
      'Prescription is required'
    );
  }
  
  const immutableStatuses = new Set([
    'pdf_generated',
    'sent',
    'received',
    'validated_by_patient',
    'active',
    'completed',
  ]);
  
  if (immutableStatuses.has(internalPrescription.status)) {
    return result.addError(
      BUSINESS_ERRORS.PRESCRIPTION_IMMUTABLE,
      `Cannot modify prescription with status: ${internalPrescription.status}`
    );
  }
  
  if (internalPrescription.revokedAt) {
    return result.addError(
      BUSINESS_ERRORS.PRESCRIPTION_REVOKED,
      'Cannot modify revoked prescription'
    );
  }
  
  return result;
};

/**
 * Validate that prescription is not already signed
 */
export const validateNotAlreadySigned = (internalPrescription) => {
  let result = createValidationResult({
    isValid: true,
    layer: VALIDATION_LAYER.BUSINESS,
  });
  
  if (!internalPrescription) {
    return result;
  }
  
  if (internalPrescription.signedRegisteredToken) {
    return result.addError(
      BUSINESS_ERRORS.ALREADY_SIGNED,
      'Prescription is already signed'
    );
  }
  
  return result;
};

/**
 * Validate that medications meet business rules
 */
export const validateMedicationsBusiness = (medications) => {
  let result = createValidationResult({
    isValid: true,
    layer: VALIDATION_LAYER.BUSINESS,
  });
  
  if (!Array.isArray(medications) || medications.length === 0) {
    return result.addError(
      BUSINESS_ERRORS.MEDICATION_INCOMPATIBLE,
      'At least one medication is required'
    );
  }
  
  // Check for narcotic substances
  const narcots = medications.filter(m => m.controlledSubstance || m.isNarcotic);
  if (narcots.length > 0) {
    // Note: For E-Rezept, this will be checked at regulatory level
    // But we add a warning here for awareness
    result = result.addWarning(
      'BUSINESS_NARCOTIC_DETECTED',
      `${narcots.length} controlled substance(s) detected - will be flagged at registration`,
      { narcoticsCount: narcots.length }
    );
  }
  
  return result;
};

// ===== HELPERS =====

/**
 * Parse duration text to approximate days
 */
const parseDurationToDays = (durationText) => {
  if (!durationText) return 0;
  
  const text = String(durationText).toLowerCase();
  
  if (text.includes('jour')) {
    const match = text.match(/(\d+)\s*jour/);
    return match ? parseInt(match[1], 10) : 0;
  }
  
  if (text.includes('semaine')) {
    const match = text.match(/(\d+)\s*semaine/);
    return match ? parseInt(match[1], 10) * 7 : 0;
  }
  
  if (text.includes('mois')) {
    const match = text.match(/(\d+)\s*mois/);
    return match ? parseInt(match[1], 10) * 30 : 0;
  }
  
  if (text.includes('an') || text.includes('année')) {
    const match = text.match(/(\d+)\s*(an|année)/);
    return match ? parseInt(match[1], 10) * 365 : 0;
  }
  
  return 0;
};

/**
 * Combine UI and business validation results
 */
export const combineValidationResults = (uiResult, businessResult) => {
  return createValidationResult({
    isValid: uiResult.isValid && businessResult.isValid,
    errors: [...(uiResult.errors || []), ...(businessResult.errors || [])],
    warnings: [...(uiResult.warnings || []), ...(businessResult.warnings || [])],
    layer: VALIDATION_LAYER.BUSINESS, // Combined = business level
  });
};
