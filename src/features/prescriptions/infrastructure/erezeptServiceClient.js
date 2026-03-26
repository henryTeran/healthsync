/**
 * E-Rezept Service Client
 *
 * Handles communication with E-Rezept (Swiss Electronic Prescription) service.
 * Provides both mock implementation (for development) and real integration pattern.
 *
 * Responsibilities:
 * - Signature of regulatory datasets
 * - Registration with E-Rezept service
 * - QR code generation
 * - Token validation
 * - Error handling + retry logic
 *
 * Architecture:
 * - Adapter pattern: Abstracts service details from application layer
 * - Strategy pattern: Can switch mock ↔ real implementation
 * - No side effects: Pure request/response
 */

import { createHash, randomUUID } from 'crypto';
import { logDebug, logError, logWarn } from '../../../shared/lib/logger.js';

/**
 * Mock Implementation (for development/testing)
 * Simulates E-Rezept service response without external call
 */
export const createMockErezeptService = (options = {}) => {
  const serviceConfig = {
    simulateErrors: false,
    errorRate: 0,
    latencyMs: 100,
    registrationId: options.registrationId || `CHM16A-${randomUUID()}`,
    ...options,
  };

  return async (regulatoryDataset, requestOptions = {}) => {
    logDebug('Mock E-Rezept service called', {
      feature: 'prescriptions',
      action: 'erezeptService',
      dataset: regulatoryDataset.Id,
    });

    // Simulate network latency
    if (serviceConfig.latencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, serviceConfig.latencyMs));
    }

    // Simulate error (for testing error handling)
    if (serviceConfig.simulateErrors || Math.random() < serviceConfig.errorRate) {
      const error = new Error('E-Rezept service temporarily unavailable');
      logError('Mock E-Rezept service error', error, {
        feature: 'prescriptions',
        action: 'erezeptService',
      });
      throw error;
    }

    // Compute checksum and signature
    const datasetChecksum = computeDatasetChecksum(regulatoryDataset);
    const { signedToken, serviceSignature } = buildSignedToken({
      registrationId: serviceConfig.registrationId,
      datasetChecksum,
      userId: requestOptions.userId || 'mock-user',
    });

    const result = {
      success: true,
      registrationId: serviceConfig.registrationId,
      signedToken,
      serviceSignature,
      checksumDataset: datasetChecksum,
      timestamp: new Date().toISOString(),
      mockService: true, // Flag indicating this is from mock
    };

    logDebug('Mock E-Rezept service response', {
      feature: 'prescriptions',
      action: 'erezeptService',
      registrationId: result.registrationId,
      checksumDataset: datasetChecksum,
    });

    return result;
  };
};

/**
 * Real E-Rezept Service Client (Pattern for real implementation)
 *
 * When integrating with real E-Rezept service:
 * 1. Add E-Rezept API credentials to environment
 * 2. Replace this with actual HTTP/HTTPS calls
 * 3. Implement retry logic + circuit breaker
 * 4. Add certificate pinning for HTTPS
 */
export const createRealErezeptService = (credentials = {}) => {
  const config = {
    apiEndpoint: credentials.apiEndpoint || process.env.EREZEPT_API_ENDPOINT,
    apiKey: credentials.apiKey || process.env.EREZEPT_API_KEY,
    certificatePath: credentials.certificatePath,
    maxRetries: credentials.maxRetries || 3,
    timeoutMs: credentials.timeoutMs || 30000,
  };

  if (!config.apiEndpoint || !config.apiKey) {
    logWarn('E-Rezept real service configured without credentials', {
      feature: 'prescriptions',
      action: 'erezeptServiceInit',
      available: {
        endpoint: !!config.apiEndpoint,
        key: !!config.apiKey,
      },
    });
  }

  return async (regulatoryDataset, requestOptions = {}) => {
    logDebug('Real E-Rezept service called', {
      feature: 'prescriptions',
      action: 'erezeptService',
      dataset: regulatoryDataset.Id,
    });

    // TODO: Implement real E-Rezept integration
    // This would include:
    // 1. HTTPS POST to E-Rezept API endpoint
    // 2. Certificate validation
    // 3. Request signing with service credentials
    // 4. Response validation
    // 5. Retry logic on network errors
    // 6. Timeout handling
    // 7. Error recovery

    // For now, throw error indicating real service not implemented
    const error = new Error(
      'Real E-Rezept service integration not yet implemented. Please use mock service or implement this endpoint.'
    );
    logError('Real E-Rezept service not implemented', error, {
      feature: 'prescriptions',
      action: 'erezeptService',
    });
    throw error;
  };
};

/**
 * Compute checksum of regulatory dataset for signature
 * Uses critical fields that identifier the prescription uniquely
 */
export const computeDatasetChecksum = (dataset = {}) => {
  const criticalFields = {
    standard: dataset.standard,
    chmedVersion: dataset.chmedVersion,
    reference: dataset.reference,
    issuedAt: dataset.issuedAt,
    expiresAt: dataset.expiresAt,
    issueType: dataset.issueType,
    repetitionsAllowed: dataset.repetitionsAllowed,
    // Patient identifiers
    patientId: dataset.Patient?.Id,
    patientIdType: dataset.Patient?.IdType,
    // Prescriber
    prescriberId: dataset.HcPerson?.Id || dataset.HcOrg?.Id,
    prescriberIdType: dataset.HcPerson?.IdType || dataset.HcOrg?.IdType,
    // Medications hash
    medicationCount: dataset.Medicaments?.length || 0,
    medicationHash: hashArray(dataset.Medicaments || []),
    // Auth data
    authSignature: dataset.Auth?.Signature || '',
  };

  const checksum = createHash('sha256')
    .update(JSON.stringify(criticalFields, null, 0))
    .digest('hex')
    .toUpperCase()
    .slice(0, 16);

  return checksum;
};

/**
 * Build signed token for E-Rezept registration
 * Creates a unique signature combining registration ID, checksum, and timestamp
 */
export const buildSignedToken = ({ registrationId, datasetChecksum, userId }) => {
  // Create seed for signature
  const signatureSeed = `${registrationId}:${datasetChecksum}:${userId}:${Date.now()}`;

  // Hash the seed
  const signature = createHash('sha256')
    .update(signatureSeed)
    .digest('hex')
    .toUpperCase();

  // Build token combining registration ID and signature
  const signedToken = `ERX-SIGNED-${registrationId}-${signature.slice(0, 12)}`;

  return {
    signedToken,
    serviceSignature: signature,
  };
};

/**
 * Hash array of medications for checksum
 * Ensures consistent ordering and representation
 */
const hashArray = (items = []) => {
  if (items.length === 0) return 'EMPTY';

  const itemsStr = items
    .map(item => JSON.stringify(item, Object.keys(item).sort()))
    .join('|');

  return createHash('sha256')
    .update(itemsStr)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();
};

/**
 * Get appropriate service instance based on environment
 * Strategy pattern: Returns mock or real implementation
 */
export const getErezeptService = (options = {}) => {
  const environment = options.environment || process.env.NODE_ENV;
  const useMock = options.forceMock || environment === 'development' || environment === 'test';

  if (useMock || !process.env.EREZEPT_API_ENDPOINT) {
    logDebug('Using mock E-Rezept service', {
      feature: 'prescriptions',
      action: 'getErezeptService',
      environment,
      reason: useMock ? 'mock forced' : 'no real credentials',
    });
    return createMockErezeptService(options.mockConfig);
  }

  logDebug('Using real E-Rezept service', {
    feature: 'prescriptions',
    action: 'getErezeptService',
    environment,
  });
  return createRealErezeptService(options.credentials);
};

/**
 * Validate E-Rezept service response
 * Ensures response has all required fields
 */
export const validateServiceResponse = (response) => {
  if (!response) {
    return { isValid: false, error: 'No response from E-Rezept service' };
  }

  const required = ['registrationId', 'signedToken', 'timestamp'];
  const missing = required.filter(field => !response[field]);

  if (missing.length > 0) {
    return { isValid: false, error: `Missing fields: ${missing.join(', ')}` };
  }

  return { isValid: true };
};
