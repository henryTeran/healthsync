/**
 * Validation Error Codes
 * 
 * Centralized error codes for all prescription validations.
 * Enables consistent error handling, localization, and debugging.
 */

// ==== VALIDATION LAYERS ====
export const VALIDATION_LAYER = {
  UI: 'ui', // Form-level validation
  BUSINESS: 'business', // Application business logic
  REGULATORY: 'regulatory', // CHMED16A compliance
};

// ==== ERROR SEVERITY ====
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// ==== ERROR CODES - UI/FORM LEVEL ====
export const UI_ERRORS = {
  PATIENT_MISSING: 'UI_PATIENT_MISSING',
  DOCTOR_MISSING: 'UI_DOCTOR_MISSING',
  MEDICATION_MISSING: 'UI_MEDICATION_MISSING',
  MEDICATION_EMPTY_LIST: 'UI_MEDICATION_EMPTY_LIST',
  
  FORM_FIELD_REQUIRED: 'UI_FORM_FIELD_REQUIRED',
  FORM_FIELD_INVALID_FORMAT: 'UI_FORM_FIELD_INVALID_FORMAT',
  FORM_FIELD_TOO_SHORT: 'UI_FORM_FIELD_TOO_SHORT',
  FORM_FIELD_TOO_LONG: 'UI_FORM_FIELD_TOO_LONG',
};

// ==== ERROR CODES - BUSINESS LOGIC ====
export const BUSINESS_ERRORS = {
  DIAGNOSIS_MISSING: 'BUSINESS_DIAGNOSIS_MISSING',
  DIAGNOSIS_INCOHERENT: 'BUSINESS_DIAGNOSIS_INCOHERENT',
  
  MEDICATION_CONTRAINDICATED: 'BUSINESS_MEDICATION_CONTRAINDICATED',
  MEDICATION_ALLERGIC_REACTION: 'BUSINESS_MEDICATION_ALLERGIC_REACTION',
  MEDICATION_INCOMPATIBLE: 'BUSINESS_MEDICATION_INCOMPATIBLE',
  
  REPETITION_INCOHERENT: 'BUSINESS_REPETITION_INCOHERENT',
  DURATION_INVALID: 'BUSINESS_DURATION_INVALID',
  
  PRESCRIPTION_IMMUTABLE: 'BUSINESS_PRESCRIPTION_IMMUTABLE',
  PRESCRIPTION_REVOKED: 'BUSINESS_PRESCRIPTION_REVOKED',
  
  ALREADY_SIGNED: 'BUSINESS_ALREADY_SIGNED',
};

// ==== ERROR CODES - REGULATORY COMPLIANCE ====
export const REGULATORY_ERRORS = {
  // Patient
  PATIENT_AVS_INVALID: 'REG_PATIENT_AVS_INVALID',
  PATIENT_INSURANCE_MISSING: 'REG_PATIENT_INSURANCE_MISSING',
  PATIENT_RECORD_NUMBER_MISSING: 'REG_PATIENT_RECORD_NUMBER_MISSING',
  
  // Prescriber
  PRESCRIBER_GLN_INVALID: 'REG_PRESCRIBER_GLN_INVALID',
  PRESCRIBER_ID_MISSING: 'REG_PRESCRIBER_ID_MISSING',
  
  // Medications
  MEDICATION_NARCOTIC_FORBIDDEN: 'REG_MEDICATION_NARCOTIC_FORBIDDEN',
  MEDICATION_STRUCTURE_INVALID: 'REG_MEDICATION_STRUCTURE_INVALID',
  
  // Dates
  DATE_FORMAT_INVALID: 'REG_DATE_FORMAT_INVALID',
  DATE_RANGE_INVALID: 'REG_DATE_RANGE_INVALID',
  
  // Signature
  SIGNATURE_TOKEN_MISSING: 'REG_SIGNATURE_TOKEN_MISSING',
  SIGNATURE_CHECKSUM_MISSING: 'REG_SIGNATURE_CHECKSUM_MISSING',
  
  // Schema
  SCHEMA_VALIDATION_FAILED: 'REG_SCHEMA_VALIDATION_FAILED',
};

// ==== HUMAN-READABLE ERROR MESSAGES (FR) ====
export const ERROR_MESSAGES = {
  // UI
  [UI_ERRORS.PATIENT_MISSING]: 'Veuillez sélectionner un patient',
  [UI_ERRORS.DOCTOR_MISSING]: 'Veuillez sélectionner un médecin',
  [UI_ERRORS.MEDICATION_MISSING]: 'Veuillez ajouter des médicaments',
  [UI_ERRORS.MEDICATION_EMPTY_LIST]: 'Au moins un médicament est requis',
  [UI_ERRORS.FORM_FIELD_REQUIRED]: 'Ce champ est obligatoire',
  [UI_ERRORS.FORM_FIELD_INVALID_FORMAT]: 'Format invalide pour ce champ',
  [UI_ERRORS.FORM_FIELD_TOO_SHORT]: 'Ce champ est trop court',
  [UI_ERRORS.FORM_FIELD_TOO_LONG]: 'Ce champ est trop long',
  
  // Business
  [BUSINESS_ERRORS.DIAGNOSIS_MISSING]: 'Le diagnostic est obligatoire',
  [BUSINESS_ERRORS.DIAGNOSIS_INCOHERENT]: 'Le diagnostic semble incohérent avec les médicaments',
  [BUSINESS_ERRORS.MEDICATION_CONTRAINDICATED]:
    'Ce médicament est contre-indiqué pour ce patient',
  [BUSINESS_ERRORS.MEDICATION_ALLERGIC_REACTION]:
    'Le patient a une allergie connue à ce médicament',
  [BUSINESS_ERRORS.MEDICATION_INCOMPATIBLE]:
    'Ce médicament est incompatible avec un autre prescrit',
  [BUSINESS_ERRORS.REPETITION_INCOHERENT]:
    'La durée et le nombre de répétitions sont incohérents',
  [BUSINESS_ERRORS.DURATION_INVALID]: 'La durée du traitement est invalide',
  [BUSINESS_ERRORS.PRESCRIPTION_IMMUTABLE]:
    'Cette ordonnance ne peut plus être modifiée',
  [BUSINESS_ERRORS.PRESCRIPTION_REVOKED]: 'Cette ordonnance a été révoquée',
  [BUSINESS_ERRORS.ALREADY_SIGNED]: 'Cette ordonnance est déjà signée',
  
  // Regulatory
  [REGULATORY_ERRORS.PATIENT_AVS_INVALID]:
    'Numéro AVS patient invalide (format attendu: 756.XXXX.XXXX.XX)',
  [REGULATORY_ERRORS.PATIENT_INSURANCE_MISSING]:
    'Informations d\'assurance patient obligatoires',
  [REGULATORY_ERRORS.PATIENT_RECORD_NUMBER_MISSING]:
    'Numéro de dossier médical patient obligatoire',
  [REGULATORY_ERRORS.PRESCRIBER_GLN_INVALID]:
    'GLN prescripteur invalide (13 chiffres attendus)',
  [REGULATORY_ERRORS.PRESCRIBER_ID_MISSING]:
    'GLN, ZSR ou numéro d\'identifiant prescripteur obligatoire',
  [REGULATORY_ERRORS.MEDICATION_NARCOTIC_FORBIDDEN]:
    'Les stupéfiants ne doivent pas être prescrits via E-Rezept Suisse',
  [REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID]:
    'Structure médicament invalide pour le format réglementaire',
  [REGULATORY_ERRORS.DATE_FORMAT_INVALID]:
    'Format de date invalide (YYYY-MM-DD attendu)',
  [REGULATORY_ERRORS.DATE_RANGE_INVALID]:
    'La date de fin doit être postérieure à la date de début',
  [REGULATORY_ERRORS.SIGNATURE_TOKEN_MISSING]:
    'Jeton de signature E-Rezept manquant',
  [REGULATORY_ERRORS.SIGNATURE_CHECKSUM_MISSING]:
    'Checksum du dataset manquant',
  [REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED]:
    'Validation du schéma CHMED16A échouée',
};

// ==== VALIDATION RESULT OBJECT ====
export const createValidationResult = ({
  isValid = true,
  errors = [], // Array of { code, message, layer, severity, details }
  warnings = [],
  layer = VALIDATION_LAYER.UI,
} = {}) => {
  return Object.freeze({
    isValid,
    errors: Array.isArray(errors) ? errors : [],
    warnings: Array.isArray(warnings) ? warnings : [],
    layer,
    
    // Summary
    errorCount: errors.length,
    warningCount: warnings.length,
    
    // Helper methods
    getErrorMessages: () => errors.map(e => e.message),
    getWarningMessages: () => warnings.map(w => w.message),
    
    addError: function(code, message, details = {}) {
      return createValidationResult({
        isValid: false,
        errors: [
          ...this.errors,
          {
            code,
            message: message || ERROR_MESSAGES[code] || code,
            layer: this.layer,
            severity: ERROR_SEVERITY.ERROR,
            details,
          },
        ],
        warnings: this.warnings,
        layer: this.layer,
      });
    },
    
    addWarning: function(code, message, details = {}) {
      return createValidationResult({
        isValid: this.isValid,
        errors: this.errors,
        warnings: [
          ...this.warnings,
          {
            code,
            message: message || ERROR_MESSAGES[code] || code,
            layer: this.layer,
            severity: ERROR_SEVERITY.WARNING,
            details,
          },
        ],
        layer: this.layer,
      });
    },
  });
};
