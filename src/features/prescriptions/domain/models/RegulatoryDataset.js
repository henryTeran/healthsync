/**
 * Regulatory Dataset Model (CHMED16A_R2)
 * 
 * The complete prescription dataset that goes to the Swiss E-Rezept service.
 * This is the official structure that gets signed and placed in QR code.
 * 
 * Structure follows CHMED16A_R2 specification exactly.
 * https://www.bag.admin.ch/dam/bag/de/dokumente/mt/arzneimittel/e-rezept/chmed16a-2.0-spec.pdf
 */

/**
 * Create a CHMED16A-compliant regulatory dataset
 */
export const createRegulatoryDataset = ({
  // ==== IDENTIFICATION ====
  internalPrescriptionId = '', // Link back to HealthSync prescription
  
  // ==== PATIENT (Administrative) ====
  patientFirstName = '',
  patientLastName = '',
  patientBirthDate = '', // 'YYYY-MM-DD'
  patientGender = '', // 1 (male) or 2 (female)
  patientStreet = '',
  patientZip = '',
  patientCity = '',
  patientAvsNumber = '', // Swiss AVS: 756.XXXX.XXXX.XX
  patientAdministrativeNotes = '',
  
  // ==== PRESCRIBER (HcPerson or HcOrg) ====
  prescriberType = 'HcPerson', // 'HcPerson' or 'HcOrg'
  prescriberFirstName = '',
  prescriberLastName = '',
  prescriberGln = '', // 13 digits, required
  prescriberZsr = '', // Optional
  prescriberSpecialization = '', // e.g., "Médecine générale"
  
  prescriberOrgName = '', // For HcOrg
  prescriberOrgGln = '', // For HcOrg (13 digits)
  prescriberOrgPhone = '', // For HcOrg
  prescriberOrgEmail = '', // For HcOrg
  
  // ==== MEDICATIONS (Array of RegulatoryMedication objects) ====
  medicaments = [], // Array of validated regulatory medications
  
  // ==== DATES ====
  createdAt = new Date().toISOString(), // 'YYYY-MM-DDTHH:MM:SSZ'
  expiresAt = null, // 'YYYY-MM-DDTHH:MM:SSZ' or null for no expiry
  
  // ==== REGISTRATION & SIGNATURE (Filled by service) ====
  signedRegisteredToken = null, // Set by E-Rezept service
  registrationId = null, // Set by E-Rezept service
  serviceSignature = null, // Set by E-Rezept service
  checksumDataset = null, // Checksum of dataset pre-signature
  
  // ==== METADATA & REMARKS ====
  remarks = '', // Legal notes, special instructions
  medicalType = 3, // Always 3 for CHMED16A_R2
  schemaVersion = 'CHMED16A_R2',
  schemaRevision = '2',
  
  // ==== REVOCATION TRACKING ====
  revokedAt = null, // null if active, ISO datetime if revoked
  revokedReason = null,
  replacedByDatasetId = null, // Reference to replacement prescription
} = {}) => {
  // Build Prescriber object (either HcPerson or HcOrg)
  let prescriber = {};
  
  if (prescriberType === 'HcOrg' || prescriberOrgName) {
    prescriber.HcOrg = {
      Name: prescriberOrgName || 'Organisation',
      Gln: prescriberOrgGln || prescriberGln || '', // Fallback to regular GLN
      ...(prescriberZsr && { Zsr: prescriberZsr }),
      ...(prescriberOrgPhone && { Phone: prescriberOrgPhone }),
      ...(prescriberOrgEmail && { Email: prescriberOrgEmail }),
    };
  } else {
    // HcPerson (individual provider)
    prescriber.HcPerson = {
      FName: prescriberFirstName || '',
      LName: prescriberLastName || '',
      Gln: prescriberGln || '',
      ...(prescriberZsr && { Zsr: prescriberZsr }),
      ...(prescriberSpecialization && { Specialization: prescriberSpecialization }),
    };
  }
  
  // Build Patient object (administrative only, minimal per CHMED16A)
  const patient = {
    FName: patientFirstName || '',
    LName: patientLastName || '',
    BDt: patientBirthDate || '', // 'YYYY-MM-DD'
    ...(patientGender && { Gender: patientGender }), // 1 or 2
    ...(patientStreet && { Street: patientStreet }),
    ...(patientZip && { Zip: patientZip }),
    ...(patientCity && { City: patientCity }),
    // Swiss AVS ID
    Ids: patientAvsNumber ? [
      {
        Id: patientAvsNumber,
        System: 'AVS', // Swiss Social Security Number
      }
    ] : [],
    ...(patientAdministrativeNotes && { AdministrativeNotes: patientAdministrativeNotes }),
  };
  
  // Build timestamp/date structure per CHMED16A
  const dateStructure = {
    CreatedAt: createdAt,
    ...(expiresAt && { ExpiresAt: expiresAt }),
  };
  
  // Build Authentication/Registration structure (filled by service)
  const auth = {};
  if (signedRegisteredToken) {
    auth.Token = signedRegisteredToken;
  }
  if (registrationId) {
    auth.RegistrationId = registrationId;
  }
  if (serviceSignature) {
    auth.ServiceSignature = serviceSignature;
  }
  if (checksumDataset) {
    auth.ChecksumDataset = checksumDataset;
  }
  
  // ==== BUILD COMPLETE DATASET ====
  const dataset = {
    // Schema metadata
    PSchema: schemaVersion,
    rev: schemaRevision,
    MedType: medicalType,
    Author: 'HealthSync-integration', // Our application identifier
    
    // Core IDs
    Id: null, // Set by service (registrationId becomes Id)
    
    // Core data structures
    Patient: patient,
    ...prescriber, // Either HcPerson or HcOrg key
    Medicaments: medicaments,
    
    // Dates
    Dt: dateStructure,
    
    // Authentication (empty until signed)
    Auth: Object.keys(auth).length > 0 ? auth : {},
    
    // Remarks & metadata
    Rmk: remarks,
    PFields: {}, // Pharmacy-specific fields (extensible)
    
    // Revocation tracking
    ...(revokedAt && { RevokedAt: revokedAt }),
    ...(revokedReason && { RevokedReason: revokedReason }),
    ...(replacedByDatasetId && { ReplacedBy: replacedByDatasetId }),
    
    // Internal reference (not in CHMED16A spec but useful)
    InternalPrescriptionId: internalPrescriptionId,
  };
  
  return Object.freeze(dataset);
};

/**
 * Validate a regulatory dataset
 * Returns array of error messages (empty if valid)
 */
export const validateRegulatoryDataset = (dataset) => {
  const errors = [];
  
  if (!dataset) {
    errors.push('Dataset object is required');
    return errors;
  }
  
  // Schema metadata
  if (dataset.PSchema !== 'CHMED16A_R2') {
    errors.push(`Invalid schema: ${dataset.PSchema}. Must be CHMED16A_R2`);
  }
  
  if (dataset.MedType !== 3) {
    errors.push(`Invalid MedType: ${dataset.MedType}. Must be 3 for E-Rezept`);
  }
  
  // Patient validation
  if (!dataset.Patient) {
    errors.push('Patient object is required');
  } else {
    if (!dataset.Patient.FName) {
      errors.push('Patient first name is required');
    }
    if (!dataset.Patient.LName) {
      errors.push('Patient last name is required');
    }
    if (!dataset.Patient.BDt) {
      errors.push('Patient birth date (YYYY-MM-DD) is required');
    }
    if (dataset.Patient.Gender && ![1, 2].includes(dataset.Patient.Gender)) {
      errors.push(`Invalid gender: ${dataset.Patient.Gender}. Must be 1 (M) or 2 (F)`);
    }
    if (!dataset.Patient.Ids || dataset.Patient.Ids.length === 0) {
      errors.push('Patient must have at least one ID (AVS/Swiss Social Security Number)');
    } else {
      const avsId = dataset.Patient.Ids.find(id => id.System === 'AVS');
      if (!avsId) {
        errors.push('Patient must have AVS (Swiss Social Security Number) in Ids array');
      }
    }
  }
  
  // Prescriber validation (must be HcPerson or HcOrg)
  const hasHcPerson = !!dataset.HcPerson;
  const hasHcOrg = !!dataset.HcOrg;
  
  if (!hasHcPerson && !hasHcOrg) {
    errors.push('Either HcPerson or HcOrg is required');
  }
  
  if (hasHcPerson) {
    if (!dataset.HcPerson.FName) {
      errors.push('Prescriber first name is required');
    }
    if (!dataset.HcPerson.LName) {
      errors.push('Prescriber last name is required');
    }
    if (!dataset.HcPerson.Gln) {
      errors.push('Prescriber GLN (13 digits) is required');
    } else if (!/^\d{13}$/.test(String(dataset.HcPerson.Gln))) {
      errors.push(`Invalid prescriber GLN format: ${dataset.HcPerson.Gln}. Must be 13 digits`);
    }
  }
  
  if (hasHcOrg) {
    if (!dataset.HcOrg.Name) {
      errors.push('Organization name is required');
    }
    if (!dataset.HcOrg.Gln) {
      errors.push('Organization GLN (13 digits) is required');
    } else if (!/^\d{13}$/.test(String(dataset.HcOrg.Gln))) {
      errors.push(`Invalid organization GLN format: ${dataset.HcOrg.Gln}. Must be 13 digits`);
    }
  }
  
  // Medications validation
  if (!dataset.Medicaments || !Array.isArray(dataset.Medicaments)) {
    errors.push('Medicaments must be an array');
  } else if (dataset.Medicaments.length === 0) {
    errors.push('At least one medication is required');
  }
  
  // Dates validation
  if (!dataset.Dt) {
    errors.push('Dt (date structure) is required');
  } else {
    if (!dataset.Dt.CreatedAt) {
      errors.push('Dt.CreatedAt is required');
    }
  }
  
  return errors;
};

/**
 * Mark dataset as signed/registered
 * Returns new immutable dataset with Auth data filled
 */
export const markAsSignedAndRegistered = (
  dataset,
  {
    registrationId = '',
    signedToken = '',
    serviceSignature = '',
    checksumDataset = '',
    registrationTimestamp = new Date().toISOString(),
  }
) => {
  if (!dataset) {
    throw new Error('Dataset is required');
  }
  
  return createRegulatoryDataset({
    // Copy all previous fields
    internalPrescriptionId: dataset.InternalPrescriptionId,
    
    patientFirstName: dataset.Patient?.FName,
    patientLastName: dataset.Patient?.LName,
    patientBirthDate: dataset.Patient?.BDt,
    patientGender: dataset.Patient?.Gender,
    patientStreet: dataset.Patient?.Street,
    patientZip: dataset.Patient?.Zip,
    patientCity: dataset.Patient?.City,
    patientAvsNumber: dataset.Patient?.Ids?.find(i => i.System === 'AVS')?.Id,
    patientAdministrativeNotes: dataset.Patient?.AdministrativeNotes,
    
    prescriberType: dataset.HcOrg ? 'HcOrg' : 'HcPerson',
    prescriberFirstName: dataset.HcPerson?.FName,
    prescriberLastName: dataset.HcPerson?.LName,
    prescriberGln: dataset.HcPerson?.Gln || dataset.HcOrg?.Gln,
    prescriberZsr: dataset.HcPerson?.Zsr || dataset.HcOrg?.Zsr,
    prescriberSpecialization: dataset.HcPerson?.Specialization,
    
    prescriberOrgName: dataset.HcOrg?.Name,
    prescriberOrgGln: dataset.HcOrg?.Gln,
    prescriberOrgPhone: dataset.HcOrg?.Phone,
    prescriberOrgEmail: dataset.HcOrg?.Email,
    
    medicaments: dataset.Medicaments,
    
    createdAt: dataset.Dt?.CreatedAt,
    expiresAt: dataset.Dt?.ExpiresAt,
    
    // NEW: Registration data
    signedRegisteredToken: signedToken,
    registrationId,
    serviceSignature,
    checksumDataset,
    
    remarks: dataset.Rmk,
    medicalType: dataset.MedType,
    schemaVersion: dataset.PSchema,
    schemaRevision: dataset.rev,
    
    revokedAt: dataset.RevokedAt,
    revokedReason: dataset.RevokedReason,
    replacedByDatasetId: dataset.ReplacedBy,
  });
};

/**
 * Mark dataset as revoked
 * Returns new immutable dataset with revocation metadata
 */
export const markAsRevoked = (
  dataset,
  {
    revokedReason = 'Révoqué suite à requête',
    revokedAt = new Date().toISOString(),
    replacedByPrescriptionId = null,
  }
) => {
  if (!dataset) {
    throw new Error('Dataset is required');
  }
  
  return createRegulatoryDataset({
    // Copy all fields from current dataset
    internalPrescriptionId: dataset.InternalPrescriptionId,
    
    patientFirstName: dataset.Patient?.FName,
    patientLastName: dataset.Patient?.LName,
    patientBirthDate: dataset.Patient?.BDt,
    patientGender: dataset.Patient?.Gender,
    patientStreet: dataset.Patient?.Street,
    patientZip: dataset.Patient?.Zip,
    patientCity: dataset.Patient?.City,
    patientAvsNumber: dataset.Patient?.Ids?.find(i => i.System === 'AVS')?.Id,
    patientAdministrativeNotes: dataset.Patient?.AdministrativeNotes,
    
    prescriberType: dataset.HcOrg ? 'HcOrg' : 'HcPerson',
    prescriberFirstName: dataset.HcPerson?.FName,
    prescriberLastName: dataset.HcPerson?.LName,
    prescriberGln: dataset.HcPerson?.Gln || dataset.HcOrg?.Gln,
    prescriberZsr: dataset.HcPerson?.Zsr || dataset.HcOrg?.Zsr,
    prescriberSpecialization: dataset.HcPerson?.Specialization,
    
    prescriberOrgName: dataset.HcOrg?.Name,
    prescriberOrgGln: dataset.HcOrg?.Gln,
    prescriberOrgPhone: dataset.HcOrg?.Phone,
    prescriberOrgEmail: dataset.HcOrg?.Email,
    
    medicaments: dataset.Medicaments,
    
    createdAt: dataset.Dt?.CreatedAt,
    expiresAt: dataset.Dt?.ExpiresAt,
    
    signedRegisteredToken: dataset.Auth?.Token,
    registrationId: dataset.Auth?.RegistrationId,
    serviceSignature: dataset.Auth?.ServiceSignature,
    checksumDataset: dataset.Auth?.ChecksumDataset,
    
    remarks: dataset.Rmk,
    medicalType: dataset.MedType,
    schemaVersion: dataset.PSchema,
    schemaRevision: dataset.rev,
    
    // NEW: Revocation metadata
    revokedAt,
    revokedReason,
    replacedByDatasetId,
  });
};
