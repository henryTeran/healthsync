import { auth } from '../config/firebase';
import { handleError, AuthError } from '../utils/errorHandler';

class SecureApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5173';
  }

  // Obtenir le token d'authentification
  async getAuthToken() {
    if (!auth.currentUser) {
      throw new AuthError('Utilisateur non authentifié');
    }
    
    try {
      return await auth.currentUser.getIdToken();
    } catch (error) {
      throw new AuthError('Impossible d\'obtenir le token d\'authentification');
    }
  }

  // Requête sécurisée générique
  async secureRequest(endpoint, options = {}) {
    try {
      const token = await this.getAuthToken();
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      };

      const config = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        if (response.status === 401) {
          throw new AuthError('Session expirée. Veuillez vous reconnecter.');
        } else if (response.status === 403) {
          throw new AuthError('Accès non autorisé');
        } else if (response.status >= 500) {
          throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
        } else {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      throw handleError(error, `SecureApiService: ${endpoint}`);
    }
  }

  // Méthodes HTTP sécurisées
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.secureRequest(url, {
      method: 'GET'
    });
  }

  async post(endpoint, data) {
    return this.secureRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.secureRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.secureRequest(endpoint, {
      method: 'DELETE'
    });
  }

  // Upload de fichiers sécurisé
  async uploadFile(endpoint, file, additionalData = {}) {
    try {
      const token = await this.getAuthToken();
      
      const formData = new FormData();
      formData.append('file', file);
      
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw handleError(error, `SecureApiService Upload: ${endpoint}`);
    }
  }
}

export const secureApiService = new SecureApiService();