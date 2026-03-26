/**
 * Regulatory Medication Model (CHMED16A)
 * 
 * Represents a single medication line as required by Swiss E-Prescription standard.
 * This is the official structure that goes into the signedRegisteredToken.
 */

/**
 * RegulatoryMedication Constructor
 * 
 * @param {Object} data - Medication data
 * @returns {Object} CHMED16A-compliant medication structure
 */
export const createRegulatoryMedication = ({
  // Identification
  id, // Pharmaindex (5 digits) or ATC code
  idType = 'Pharmaindex', // 'Pharmaindex' or 'ATC'
  
  // Posology (array of dose schedules)
  posologyArray = [], // Array of { time: 'HH:MM', doses: [v1, v2, v3, v4], durationTo: 'YYYY-MM-DD' }
  
  // Unit and instructions
  unit = 'mg', // mg, ml, Kapsel, IU, etc
  applicationInstructions = '', // "avec nourriture", "le matin", etc
  
  // Repetition and packages
  repetitionMonths = 0, // 0 = non-repetable, 1-12 = repeat for N months
  numberOfPackages = 1, // How many packages to dispense
  
  // Substitution
  substitutionForbidden = false,
  substitutionReason = '', // If forbidden, why
  
  // Additional info
  patientInstruction = '', // Special instructions for patient
  reportingCode = '', // Optional pharmacy reporting
} = {}) => {
  // Validate ID type
  if (!['Pharmaindex', 'ATC'].includes(idType)) {
    throw new Error(`Invalid idType: ${idType}. Must be 'Pharmaindex' or 'ATC'`);
  }
  
  // Validate repetition is 0-12
  if (repetitionMonths < 0 || repetitionMonths > 12) {
    throw new Error(`Repetition months must be 0-12, got ${repetitionMonths}`);
  }
  
  // Transform posologyArray to CHMED16A format
  const pos = (posologyArray || []).map(schedule => ({
    Time: schedule.time || '', // 'HH:MM' format
    D: (schedule.doses || []).slice(0, 4), // Max 4 dose values
    DtTo: schedule.durationTo || '', // 'YYYY-MM-DD' format
  })).filter(p => p.Time || p.DtTo); // Only include if has time or duration
  
  // Build the CHMED16A medication structure
  const medication = {
    // Identification (CHMED16A)
    Id: id || '',
    IdType: idType,
    
    // Posology (structured dose schedules)
    Pos: pos,
    
    // Unit
    Unit: unit,
    
    // Application instructions
    AppInstr: applicationInstructions,
    
    // Repetition (months, 0 = non-repetable per CHMED16A spec)
    Rep: repetitionMonths,
    
    // Number of packages
    NbPack: numberOfPackages,
    
    // Substitution restriction
    Subs: substitutionForbidden,
    
    // Pharmacy-specific fields
    ...(reportingCode && { ReportCode: reportingCode }),
    ...(substitutionReason && { SubsReason: substitutionReason }),
    ...(patientInstruction && { PatientInstr: patientInstruction }),
  };
  
  return Object.freeze(medication);
};

/**
 * Validate a regulatory medication
 * Returns array of error messages (empty if valid)
 */
export const validateRegulatoryMedication = (medication) => {
  const errors = [];
  
  if (!medication) {
    errors.push('Medication object is required');
    return errors;
  }
  
  if (!medication.Id) {
    errors.push('Medication ID (Pharmaindex or ATC) is required');
  }
  
  if (!['Pharmaindex', 'ATC'].includes(medication.IdType)) {
    errors.push(`Invalid IdType: ${medication.IdType}. Must be 'Pharmaindex' or 'ATC'`);
  }
  
  if (!medication.Unit) {
    errors.push('Unit (mg, ml, Kapsel, etc) is required');
  }
  
  if (medication.Rep < 0 || medication.Rep > 12) {
    errors.push(`Repetition must be 0-12, got ${medication.Rep}`);
  }
  
  if (medication.NbPack < 1) {
    errors.push('Number of packages must be at least 1');
  }
  
  // Validate posology if present
  if (medication.Pos && Array.isArray(medication.Pos)) {
    medication.Pos.forEach((posSchedule, idx) => {
      if (posSchedule.Time && !/^\d{2}:\d{2}$/.test(posSchedule.Time)) {
        errors.push(`Posology schedule ${idx}: Time must be HH:MM format`);
      }
      if (posSchedule.D && !Array.isArray(posSchedule.D)) {
        errors.push(`Posology schedule ${idx}: D must be an array`);
      }
      if (posSchedule.D && posSchedule.D.length > 4) {
        errors.push(`Posology schedule ${idx}: D array can have max 4 values`);
      }
      if (posSchedule.DtTo && !/^\d{4}-\d{2}-\d{2}$/.test(posSchedule.DtTo)) {
        errors.push(`Posology schedule ${idx}: DtTo must be YYYY-MM-DD format`);
      }
    });
  }
  
  return errors;
};

/**
 * Transform internal HealthSync medication to regulatory medication
 * Used by RegulatoryTransformer
 */
export const transformToRegulatoryMedication = (internalMedication, defaults = {}) => {
  if (!internalMedication) {
    throw new Error('Internal medication is required');
  }
  
  // Extract or compute posology array from internal medicine
  const posologyArray = extractPosologySchedules(
    internalMedication.posology,
    internalMedication.frequency,
    internalMedication.duration
  );
  
  return createRegulatoryMedication({
    id: internalMedication.medicationCode || internalMedication.id || defaults.id,
    idType: internalMedication.codeType || defaults.idType || 'Pharmaindex',
    
    posologyArray,
    
    unit: internalMedication.unit || defaults.unit || 'mg',
    applicationInstructions: internalMedication.applicationInstructions || defaults.applicationInstructions || '',
    
    repetitionMonths: internalMedication.repeatMonths || defaults.repetitionMonths || 0,
    numberOfPackages: internalMedication.quantity || defaults.numberOfPackages || 1,
    
    substitutionForbidden: internalMedication.substitutionForbidden || defaults.substitutionForbidden || false,
    substitutionReason: internalMedication.substitutionReason || defaults.substitutionReason || '',
    
    patientInstruction: internalMedication.patientInstruction || defaults.patientInstruction || '',
  });
};

/**
 * Helper: Extract posology schedules from free-text internal format
 * This is an approximation; a better UI would capture structured times
 */
const extractPosologySchedules = (posology, frequency, duration) => {
  // If internal model already has structured posology, use it
  if (Array.isArray(posology)) {
    return posology;
  }
  
  // Approximate: create simple schedule based on frequency
  // This is a fallback; real implementation should use UI form
  const schedule = [];
  
  if (frequency && duration) {
    const durationDays = parseDurationToDays(duration);
    if (durationDays) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      
      schedule.push({
        time: '08:00', // Default morning
        doses: [1], // Default 1 unit
        durationTo: endDate.toISOString().split('T')[0],
      });
    }
  }
  
  return schedule;
};

/**
 * Helper: Parse duration text to days
 * Examples: "7 jours", "2 semaines", "1 mois"
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
  
  return 0;
};

/**
 * Check if a regulatory medication is valid for E-Rezept (no narcotics, etc)
 */
export const isValidForErezept = (medication) => {
  // Swiss E-Rezept excludes:
  // - Narcotic substances (Suchtmittel)
  // - Some restricted substances
  
  // TODO: Check against narcotics list if medication has NarcoticsExcluded flag
  // For now, assume caller has filtered these
  
  return validateRegulatoryMedication(medication).length === 0;
};
