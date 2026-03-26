/**
 * Regulatory Validator
 *
 * Validates prescription against CHMED16A and Swiss E-Rezept requirements.
 * This is Layer 3 validation (strict regulatory conformance).
 *
 * Uses JSON Schema Ajv for schema validation + additional business rules.
 */

import {
  createValidationResult,
  VALIDATION_LAYER,
  REGULATORY_ERRORS,
  ERROR_SEVERITY,
} from './ValidationErrors.js';

/**
 * Validate regulatory dataset against CHMED16A schema
 *
 * @param {Object} regulatoryDataset - The CHMED16A dataset
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateRegulatoryDataset = (regulatoryDataset, options = {}) => {
  let result = createValidationResult({
    isValid: true,
    layer: VALIDATION_LAYER.REGULATORY,
  });

  if (!regulatoryDataset) {
    return result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      'Regulatory dataset is required'
    );
  }

  // ===== SCHEMA STRUCTURE =====
  // PSchema, rev, MedType
  if (regulatoryDataset.PSchema !== 'CHMED16A_R2') {
    result = result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      `Invalid schema: ${regulatoryDataset.PSchema}. Must be CHMED16A_R2`
    );
  }

  if (regulatoryDataset.MedType !== 3) {
    result = result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      `Invalid MedType: ${regulatoryDataset.MedType}. Must be 3 for E-Rezept`
    );
  }

  // ===== PATIENT VALIDATION =====
  result = validatePatientSection(regulatoryDataset.Patient, result);

  // ===== PRESCRIBER VALIDATION =====
  result = validatePrescriberSection(regulatoryDataset, result);

  // ===== MEDICATIONS VALIDATION =====
  result = validateMedicamentsSection(regulatoryDataset.Medicaments, result);

  // ===== DATES VALIDATION =====
  result = validateDatesSection(regulatoryDataset.Dt, result);

  // ===== SIGNATURE VALIDATION (if required) =====
  if (options.requireSignature !== false) {
    result = validateSignatureSection(regulatoryDataset.Auth, result, options);
  }

  // ===== NARCOTIC CHECK =====
  result = validateNarcoticsExcluded(regulatoryDataset, result);

  result.isValid = result.errors.length === 0;
  return result;
};

/**
 * Validate Patient section (required fields per CHMED16A)
 */
const validatePatientSection = (patient, result) => {
  if (!patient) {
    return result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      'Patient object is required'
    );
  }

  // First name
  if (!patient.FName || String(patient.FName).trim().length === 0) {
    result = result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      'Patient first name (FName) is required'
    );
  }

  // Last name
  if (!patient.LName || String(patient.LName).trim().length === 0) {
    result = result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      'Patient last name (LName) is required'
    );
  }

  // Birth date
  if (!patient.BDt || !isValidSwissDate(patient.BDt)) {
    result = result.addError(
      REGULATORY_ERRORS.DATE_FORMAT_INVALID,
      `Patient birth date (BDt) must be YYYY-MM-DD format, got: ${patient.BDt}`
    );
  }

  // Gender (optional but if present, must be 1 or 2)
  if (patient.Gender && ![1, 2].includes(patient.Gender)) {
    result = result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      `Patient Gender must be 1 (male) or 2 (female), got: ${patient.Gender}`
    );
  }

  // IDs (must have AVS)
  if (!patient.Ids || patient.Ids.length === 0) {
    result = result.addError(
      REGULATORY_ERRORS.PATIENT_RECORD_NUMBER_MISSING,
      'Patient must have at least one ID in Ids array'
    );
  } else {
    const avsId = patient.Ids.find(id => id.System === 'AVS' || id.System === 'swiss-avs');
    if (!avsId) {
      result = result.addError(
        REGULATORY_ERRORS.PATIENT_AVS_INVALID,
        'Patient must have AVS (Swiss Social Security Number) Ids'
      );
    } else if (!isValidSwissAVS(avsId.Id)) {
      result = result.addError(
        REGULATORY_ERRORS.PATIENT_AVS_INVALID,
        `Invalid AVS format: ${avsId.Id}. Expected: 756.XXXX.XXXX.XX`
      );
    }
  }

  return result;
};

/**
 * Validate Prescriber section (HcPerson or HcOrg, GLN required)
 */
const validatePrescriberSection = (dataset, result) => {
  const hasHcPerson = !!dataset.HcPerson;
  const hasHcOrg = !!dataset.HcOrg;

  if (!hasHcPerson && !hasHcOrg) {
    return result.addError(
      REGULATORY_ERRORS.PRESCRIBER_ID_MISSING,
      'Either HcPerson or HcOrg is required'
    );
  }

  // If HcPerson
  if (hasHcPerson) {
    const hcp = dataset.HcPerson;

    if (!hcp.FName || String(hcp.FName).trim().length === 0) {
      result = result.addError(
        REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
        'HcPerson first name (FName) is required'
      );
    }

    if (!hcp.LName || String(hcp.LName).trim().length === 0) {
      result = result.addError(
        REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
        'HcPerson last name (LName) is required'
      );
    }

    if (!hcp.Gln || !isValidGLN(hcp.Gln)) {
      result = result.addError(
        REGULATORY_ERRORS.PRESCRIBER_GLN_INVALID,
        `Invalid HcPerson GLN: ${hcp.Gln}. Must be 13 digits`
      );
    }
  }

  // If HcOrg
  if (hasHcOrg) {
    const hco = dataset.HcOrg;

    if (!hco.Name || String(hco.Name).trim().length === 0) {
      result = result.addError(
        REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
        'HcOrg Name is required'
      );
    }

    if (!hco.Gln || !isValidGLN(hco.Gln)) {
      result = result.addError(
        REGULATORY_ERRORS.PRESCRIBER_GLN_INVALID,
        `Invalid HcOrg GLN: ${hco.Gln}. Must be 13 digits`
      );
    }
  }

  return result;
};

/**
 * Validate Medicaments section (array, structure, content)
 */
const validateMedicamentsSection = (medicaments, result) => {
  if (!Array.isArray(medicaments)) {
    return result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      'Medicaments must be an array'
    );
  }

  if (medicaments.length === 0) {
    return result.addError(
      REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
      'At least one medication is required'
    );
  }

  // Validate each medication
  medicaments.forEach((med, idx) => {
    if (!med) {
      result = result.addError(
        REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
        `Medication ${idx} is null or undefined`
      );
      return;
    }

    // ID required
    if (!med.Id) {
      result = result.addError(
        REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
        `Medication ${idx}: Id (Pharmaindex or ATC) is required`
      );
    }

    // IdType required and valid
    if (!['Pharmaindex', 'ATC'].includes(med.IdType)) {
      result = result.addError(
        REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
        `Medication ${idx}: IdType must be 'Pharmaindex' or 'ATC', got: ${med.IdType}`
      );
    }

    // Unit required
    if (!med.Unit) {
      result = result.addError(
        REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
        `Medication ${idx}: Unit (mg, ml, etc) is required`
      );
    }

    // Rep must be 0-12
    if (med.Rep < 0 || med.Rep > 12) {
      result = result.addError(
        REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
        `Medication ${idx}: Rep must be 0-12, got: ${med.Rep}`
      );
    }

    // NbPack must be >= 1
    if (!med.NbPack || med.NbPack < 1) {
      result = result.addError(
        REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
        `Medication ${idx}: NbPack must be >= 1, got: ${med.NbPack}`
      );
    }

    // Validate Posology if present
    if (med.Pos && Array.isArray(med.Pos)) {
      med.Pos.forEach((pos, posIdx) => {
        if (pos.Time && !/^\d{2}:\d{2}$/.test(pos.Time)) {
          result = result.addError(
            REGULATORY_ERRORS.DATE_FORMAT_INVALID,
            `Medication ${idx} Posology ${posIdx}: Time must be HH:MM format, got: ${pos.Time}`
          );
        }

        if (pos.D && !Array.isArray(pos.D)) {
          result = result.addError(
            REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
            `Medication ${idx} Posology ${posIdx}: D must be an array`
          );
        }

        if (pos.D && pos.D.length > 4) {
          result = result.addError(
            REGULATORY_ERRORS.MEDICATION_STRUCTURE_INVALID,
            `Medication ${idx} Posology ${posIdx}: D array max length is 4, got: ${pos.D.length}`
          );
        }

        if (pos.DtTo && !isValidSwissDate(pos.DtTo)) {
          result = result.addError(
            REGULATORY_ERRORS.DATE_FORMAT_INVALID,
            `Medication ${idx} Posology ${posIdx}: DtTo must be YYYY-MM-DD format, got: ${pos.DtTo}`
          );
        }
      });
    }
  });

  return result;
};

/**
 * Validate Dt (dates) section
 */
const validateDatesSection = (dt, result) => {
  if (!dt) {
    return result.addError(
      REGULATORY_ERRORS.SCHEMA_VALIDATION_FAILED,
      'Dt (date structure) is required'
    );
  }

  if (!dt.CreatedAt || !isValidISODate(dt.CreatedAt)) {
    result = result.addError(
      REGULATORY_ERRORS.DATE_FORMAT_INVALID,
      `Dt.CreatedAt must be ISO 8601 format, got: ${dt.CreatedAt}`
    );
  }

  if (dt.ExpiresAt && !isValidISODate(dt.ExpiresAt)) {
    result = result.addError(
      REGULATORY_ERRORS.DATE_FORMAT_INVALID,
      `Dt.ExpiresAt must be ISO 8601 format, got: ${dt.ExpiresAt}`
    );
  }

  // ExpiresAt should be after CreatedAt (if both present)
  if (dt.CreatedAt && dt.ExpiresAt) {
    const created = new Date(dt.CreatedAt);
    const expires = new Date(dt.ExpiresAt);

    if (expires <= created) {
      result = result.addError(
        REGULATORY_ERRORS.DATE_RANGE_INVALID,
        'Dt.ExpiresAt must be after Dt.CreatedAt'
      );
    }
  }

  return result;
};

/**
 * Validate Auth (signature/registration) section
 */
const validateSignatureSection = (auth, result, options = {}) => {
  // If signature is required but not present
  if (!auth || Object.keys(auth).length === 0) {
    result = result.addError(
      REGULATORY_ERRORS.SIGNATURE_TOKEN_MISSING,
      'Auth (registration/signature) is required for signed prescriptions'
    );
  } else {
    // Check required auth fields
    if (!auth.Token) {
      result = result.addError(
        REGULATORY_ERRORS.SIGNATURE_TOKEN_MISSING,
        'Auth.Token (signed registered token) is required'
      );
    }

    if (!auth.ChecksumDataset) {
      result = result.addError(
        REGULATORY_ERRORS.SIGNATURE_CHECKSUM_MISSING,
        'Auth.ChecksumDataset is required'
      );
    }
  }

  return result;
};

/**
 * Validate no narcotic substances (Swiss E-Rezept requirement)
 */
const validateNarcoticsExcluded = (dataset, result) => {
  // Get medicament Ids that are known narcotics (simplified check)
  // In production, this would check against an official narcotics list

  const knownNarcotics = [
    'N02AA',
    'N02AB', // Narcotics list (simplified ATC codes)
  ];

  const medicaments = dataset.Medicaments || [];
  const narcoticsFound = medicaments.filter(med => {
    if (med.IdType === 'ATC') {
      return knownNarcotics.some(narcotic => med.Id.startsWith(narcotic));
    }
    // Pharmaindex check would require lookup in database
    return false;
  });

  if (narcoticsFound.length > 0) {
    result = result.addError(
      REGULATORY_ERRORS.MEDICATION_NARCOTIC_FORBIDDEN,
      `Narcotic substances detected: ${narcoticsFound.map(m => m.Id).join(', ')}. Not allowed in E-Rezept.`
    );
  }

  return result;
};

// ===== VALIDATION HELPERS =====

/**
 * Check if date is valid Swiss date format (YYYY-MM-DD)
 */
const isValidSwissDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

/**
 * Check if datetime is valid ISO 8601 format
 */
const isValidISODate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  try {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Check if GLN is valid (13 digits)
 */
const isValidGLN = (gln) => {
  if (!gln) return false;
  const digits = String(gln).replace(/\D/g, '');
  return /^\d{13}$/.test(digits);
};

/**
 * Check if AVS number is valid Swiss format
 */
const isValidSwissAVS = (avs) => {
  if (!avs) return false;

  const avsStr = String(avs).trim();

  // Format: 756.XXXX.XXXX.XX or compact 756XXXXXXXXXX
  const withDots = /^756\.\d{4}\.\d{4}\.\d{2}$/.test(avsStr);
  const compact = /^756\d{10}$/.test(avsStr);

  return withDots || compact;
};

/**
 * Validate complete transformation ready for signing
 * (dataset is complete and ready to send to service)
 */
export const validateReadyForSigning = (regularDataset) => {
  return validateRegulatoryDataset(regularDataset, {
    requireSignature: false, // Don't require Auth section yet (will be filled by service)
  });
};

/**
 * Validate complete signed dataset
 * (dataset has been signed and registered by service)
 */
export const validateSignedAndRegistered = (regulatoryDataset) => {
  return validateRegulatoryDataset(regulatoryDataset, {
    requireSignature: true, // MUST have Auth section
  });
};
