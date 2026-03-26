/**
 * Prescription Statuses
 * 
 * Defines:
 * - Application workflow: HealthSync internal statuses
 * - Regulatory workflow: CHMED16A/E-Rezept specific states
 * - Pharmacy workflow: (future) dispensation states
 * - Allowed transitions between states
 */

// ============================================
// APPLICATION WORKFLOW (HealthSync internal)
// ============================================
export const APPLICATION_WORKFLOW = {
  DRAFT: 'draft',
  CREATED: 'created',
  PDF_GENERATED: 'pdf_generated',
  SENT: 'sent',
  RECEIVED: 'received',
  VALIDATED_BY_PATIENT: 'validated_by_patient',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ============================================
// REGULATORY WORKFLOW (CHMED16A/E-Rezept)
// ============================================
export const REGULATORY_WORKFLOW = {
  DRAFT: 'regulatory_draft',
  READY_FOR_SIGNATURE: 'regulatory_ready_for_signature',
  SIGNED_REGISTERED: 'regulatory_signed_registered',
  REVOKED: 'regulatory_revoked',
  REPLACED: 'regulatory_replaced',
};

// ============================================
// PHARMACY WORKFLOW (Future - Dispensation)
// ============================================
export const PHARMACY_WORKFLOW = {
  VERIFIED: 'pharmacy_verified',
  NON_HONOREE: 'pharmacy_non_honoree',
  PARTIELLEMENT_HONOREE: 'pharmacy_partiellement_honoree',
  INTEGRALEMENT_HONOREE: 'pharmacy_integralement_honoree',
  CANCELLED_DISPENSE: 'pharmacy_cancelled_dispense',
};

// ============================================
// COMBINED FOR BACKWARD COMPATIBILITY
// ============================================
export const PRESCRIPTION_STATUS = {
  ...APPLICATION_WORKFLOW,
  ...REGULATORY_WORKFLOW,
  ...PHARMACY_WORKFLOW,
};

// ============================================
// TRANSITIONS - Application Workflow
// ============================================
const APP_TRANSITIONS = {
  [APPLICATION_WORKFLOW.DRAFT]: [
    APPLICATION_WORKFLOW.CREATED,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.CREATED]: [
    APPLICATION_WORKFLOW.PDF_GENERATED,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.PDF_GENERATED]: [
    APPLICATION_WORKFLOW.SENT,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.SENT]: [
    APPLICATION_WORKFLOW.RECEIVED,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.RECEIVED]: [
    APPLICATION_WORKFLOW.VALIDATED_BY_PATIENT,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.VALIDATED_BY_PATIENT]: [
    APPLICATION_WORKFLOW.ACTIVE,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.ACTIVE]: [
    APPLICATION_WORKFLOW.COMPLETED,
    APPLICATION_WORKFLOW.CANCELLED,
  ],
  [APPLICATION_WORKFLOW.COMPLETED]: [],
  [APPLICATION_WORKFLOW.CANCELLED]: [],
};

// ============================================
// TRANSITIONS - Regulatory Workflow
// ============================================
const REGULATORY_TRANSITIONS = {
  [REGULATORY_WORKFLOW.DRAFT]: [
    REGULATORY_WORKFLOW.READY_FOR_SIGNATURE,
    REGULATORY_WORKFLOW.REVOKED,
  ],
  [REGULATORY_WORKFLOW.READY_FOR_SIGNATURE]: [
    REGULATORY_WORKFLOW.SIGNED_REGISTERED,
    REGULATORY_WORKFLOW.DRAFT,
  ],
  [REGULATORY_WORKFLOW.SIGNED_REGISTERED]: [
    REGULATORY_WORKFLOW.REVOKED,
    REGULATORY_WORKFLOW.REPLACED,
  ],
  [REGULATORY_WORKFLOW.REVOKED]: [
    REGULATORY_WORKFLOW.REPLACED,
  ],
  [REGULATORY_WORKFLOW.REPLACED]: [],
};

// ============================================
// ALL TRANSITIONS (Combined)
// ============================================
const ALL_TRANSITIONS = {
  ...APP_TRANSITIONS,
  ...REGULATORY_TRANSITIONS,
};

// ============================================
// STATUS UTILS
// ============================================

/**
 * Check if status is valid (known)
 */
export const isValidPrescriptionStatus = (status) =>
  Object.values(PRESCRIPTION_STATUS).includes(status);

/**
 * Check if transition is allowed
 */
export const canTransitionPrescriptionStatus = (fromStatus, toStatus) => {
  if (!isValidPrescriptionStatus(toStatus)) return false;
  
  const allowedTransitions = ALL_TRANSITIONS[fromStatus];
  return allowedTransitions ? allowedTransitions.includes(toStatus) : false;
};

/**
 * Get next allowed statuses from current
 */
export const getNextAllowedStatuses = (currentStatus) =>
  ALL_TRANSITIONS[currentStatus] || [];

/**
 * Check if prescription is immutable (can't be edited)
 */
export const isImmutableStatus = (status) => {
  const immutableStatuses = new Set([
    APPLICATION_WORKFLOW.PDF_GENERATED,
    APPLICATION_WORKFLOW.SENT,
    APPLICATION_WORKFLOW.RECEIVED,
    APPLICATION_WORKFLOW.VALIDATED_BY_PATIENT,
    APPLICATION_WORKFLOW.ACTIVE,
    REGULATORY_WORKFLOW.SIGNED_REGISTERED,
  ]);
  return immutableStatuses.has(status);
};

/**
 * Check if prescription requires regulatory data (not just internal)
 */
export const requiresRegulatoryData = (status) => {
  return status !== APPLICATION_WORKFLOW.DRAFT &&
    status !== APPLICATION_WORKFLOW.CREATED;
};

/**
 * Human-readable label for status (FR)
 */
export const getStatusLabel = (status) => {
  const labels = {
    // Application
    draft: 'Brouillon',
    created: 'Créé',
    pdf_generated: 'PDF généré',
    sent: 'Envoyé',
    received: 'Reçu',
    validated_by_patient: 'Validé par le patient',
    active: 'Actif',
    completed: 'Complété',
    cancelled: 'Annulé',
    
    // Regulatory
    regulatory_draft: 'Brouillon réglementaire',
    regulatory_ready_for_signature: 'Prêt pour signature',
    regulatory_signed_registered: 'Signé et enregistré',
    regulatory_revoked: 'Révoqué',
    regulatory_replaced: 'Remplacé',
    
    // Pharmacy
    pharmacy_verified: 'Vérifié par pharmacie',
    pharmacy_non_honoree: 'Non honorée',
    pharmacy_partiellement_honoree: 'Partiellement honorée',
    pharmacy_integralement_honoree: 'Intégralement honorée',
    pharmacy_cancelled_dispense: 'Dispensation annulée',
  };
  
  return labels[status] || status;
};
