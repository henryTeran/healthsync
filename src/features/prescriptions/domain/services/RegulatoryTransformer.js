/**
 * Regulatory Transformer Service
 *
 * Transforms internal HealthSync prescription data to CHMED16A regulatory dataset.
 * This is the critical bridge between internal and regulatory models.
 *
 * Key responsibil ities:
 * - Map internal prescription to regulatory structure
 * - Convert internal medications to regulatory medications
 * - Ensure no data loss or corruption during transformation
 * - Handle edge cases and defaults
 */

import { createRegulatoryDataset } from '../models/RegulatoryDataset.js';
import {
  createRegulatoryMedication,
  transformToRegulatoryMedication,
} from '../models/RegulatoryMedication.js';
import {
  validateRegulatoryDataset,
  validateReadyForSigning,
} from '../validators/RegulatoryValidator.js';
import {
  createValidationResult,
  VALIDATION_LAYER,
} from '../validators/ValidationErrors.js';

/**
 * Transform internal prescription to regulatory dataset
 *
 * This is the main entry point for transforming data.
 * Validates both input and output.
 *
 * @param {Object} internalPrescription - The HealthSync internal prescription
 * @param {Object} patientProfile - Complete patient profile data
 * @param {Object} prescriberProfile - Complete doctor/prescriber profile
 * @param {Object} options - Transformation options
 * @returns {Object} - { success: boolean, dataset: ?, errors: [] }
 */
export const transformInternalToRegulatoryDataset = (
  internalPrescription,
  patientProfile,
  prescriberProfile,
  options = {}
) => {
  const result = {
    success: false,
    dataset: null,
    errors: [],
  };

  // ===== INPUT VALIDATION =====
  if (!internalPrescription) {
    result.errors.push('Internal prescription is required');
    return result;
  }

  if (!patientProfile) {
    result.errors.push('Patient profile is required');
    return result;
  }

  if (!prescriberProfile) {
    result.errors.push('Prescriber profile is required');
    return result;
  }

  try {
    // ===== EXTRACT PATIENT DATA =====
    const patientData = extractPatientData(patientProfile);
    if (!patientData) {
      result.errors.push('Failed to extract valid patient data');
      return result;
    }

    // ===== EXTRACT PRESCRIBER DATA =====
    const prescriberData = extractPrescriberData(prescriberProfile);
    if (!prescriberData) {
      result.errors.push('Failed to extract valid prescriber data');
      return result;
    }

    // ===== TRANSFORM MEDICATIONS =====
    const medications = (internalPrescription.medications || []).map(intMed =>
      transformToRegulatoryMedication(intMed, options.medicationDefaults)
    );

    if (medications.length === 0) {
      result.errors.push('At least one medication is required');
      return result;
    }

    // ===== CREATE REGULATORY DATASET =====
    const dataset = createRegulatoryDataset({
      internalPrescriptionId: internalPrescription.id,

      // Patient
      patientFirstName: patientData.firstName,
      patientLastName: patientData.lastName,
      patientBirthDate: patientData.birthDate,
      patientGender: patientData.gender,
      patientStreet: patientData.street,
      patientZip: patientData.zip,
      patientCity: patientData.city,
      patientAvsNumber: patientData.avsNumber,
      patientAdministrativeNotes: patientData.administrativeNotes,

      // Prescriber
      prescriberType: prescriberData.type,
      prescriberFirstName: prescriberData.firstName,
      prescriberLastName: prescriberData.lastName,
      prescriberGln: prescriberData.gln,
      prescriberZsr: prescriberData.zsr,
      prescriberSpecialization: prescriberData.specialization,
      prescriberOrgName: prescriberData.orgName,
      prescriberOrgGln: prescriberData.orgGln,
      prescriberOrgPhone: prescriberData.orgPhone,
      prescriberOrgEmail: prescriberData.orgEmail,

      // Medications
      medicaments: medications,

      // Dates
      createdAt: internalPrescription.creationDate || new Date().toISOString(),
      expiresAt: computeExpirationDate(internalPrescription.medications),

      // Remarks
      remarks:
        options.remarks ||
        `Prescription générée par HealthSync. ${
          internalPrescription.clinicalInfo?.diagnosis
            ? `Diagnostic: ${internalPrescription.clinicalInfo.diagnosis}`
            : ''
        }`,

      // Internal reference
      ...prescriberData,
    });

    // ===== VALIDATE OUTPUT =====
    const validationResult = validateReadyForSigning(dataset);
    if (!validationResult.isValid) {
      result.errors.push(
        `Regulatory dataset validation failed: ${validationResult
          .getErrorMessages()
          .join(', ')}`
      );
      return result;
    }

    result.success = true;
    result.dataset = dataset;
  } catch (error) {
    result.errors.push(`Transformation error: ${error.message}`);
  }

  return result;
};

/**
 * Extract and validate patient data from profile
 */
const extractPatientData = (patientProfile) => {
  if (!patientProfile) return null;

  const firstName = patientProfile.firstName || patientProfile.prenom || '';
  const lastName = patientProfile.lastName || patientProfile.nom || '';
  const birthDate = patientProfile.birthDate || patientProfile.dateOfBirth || '';
  const avsNumber = patientProfile.avsNumber || patientProfile.avs || '';

  // Validate required fields
  if (!firstName || !lastName || !birthDate) {
    return null;
  }

  // Parse gender (0/M/male → 1, 1/F/female → 2)
  let gender = null;
  if (patientProfile.gender) {
    const g = String(patientProfile.gender).toLowerCase();
    if (g === 'male' || g === 'm' || g === '0' || g === 1) {
      gender = 1;
    } else if (g === 'female' || g === 'f' || g === '1' || g === 2) {
      gender = 2;
    }
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    birthDate: normalizeDateToSwiss(birthDate),
    gender,
    street: patientProfile.street || patientProfile.rue || '',
    zip: patientProfile.zip || patientProfile.codePostal || '',
    city: patientProfile.city || patientProfile.ville || '',
    avsNumber: avsNumber.trim(),
    administrativeNotes: patientProfile.administrativeNotes || '',
  };
};

/**
 * Extract and validate prescriber data from profile
 */
const extractPrescriberData = (prescriberProfile) => {
  if (!prescriberProfile) return null;

  const firstName = prescriberProfile.firstName || prescriberProfile.prenom || '';
  const lastName = prescriberProfile.lastName || prescriberProfile.nom || '';
  const gln = prescriberProfile.gln || prescriberProfile.GLN || '';
  const zsr = prescriberProfile.zsr || prescriberProfile.ZSR || '';

  // Type: mostly HcPerson (individuals) unless marked as organization
  const prescriberType = prescriberProfile.type === 'HcOrg' ? 'HcOrg' : 'HcPerson';

  if (prescriberType === 'HcOrg') {
    return {
      type: 'HcOrg',
      orgName: prescriberProfile.organization || prescriberProfile.name || '',
      orgGln: gln,
      orgPhone: prescriberProfile.phone || '',
      orgEmail: prescriberProfile.email || '',
      firstName: null,
      lastName: null,
      gln,
      zsr,
      specialization: null,
    };
  }

  // HcPerson
  if (!firstName || !lastName || !gln) {
    return null; // Required for HcPerson
  }

  return {
    type: 'HcPerson',
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    gln: gln.trim(),
    zsr: zsr.trim(),
    specialization:
      prescriberProfile.specialty ||
      prescriberProfile.department ||
      prescriberProfile.specialization ||
      '',

    // For org variant (if needed)
    orgName: null,
    orgGln: null,
    orgPhone: null,
    orgEmail: null,
  };
};

/**
 * Normalize date to Swiss format (YYYY-MM-DD)
 */
const normalizeDateToSwiss = (dateInput) => {
  if (!dateInput) return '';

  // Already Swiss format?
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  // Try to parse
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Compute prescription expiration date based on medications
 * (Usually end of last medication duration)
 */
const computeExpirationDate = (medications) => {
  if (!Array.isArray(medications) || medications.length === 0) {
    // Default: 90 days from now
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString();
  }

  // Find latest expiration among medications
  let latestDate = new Date();

  medications.forEach(med => {
    const durationDays = parseDurationToDays(med.duration);
    if (durationDays > 0) {
      const medExpiry = new Date();
      medExpiry.setDate(medExpiry.getDate() + durationDays);
      if (medExpiry > latestDate) {
        latestDate = medExpiry;
      }
    }
  });

  return latestDate.toISOString();
};

/**
 * Parse duration text to days
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
 * Helper: Get transformation errors in human-readable form
 */
export const getTransformationErrorsText = (transformResult) => {
  if (transformResult.success) {
    return null;
  }

  return transformResult.errors.join('\n• ');
};
