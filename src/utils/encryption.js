// Utilitaires de chiffrement pour les données sensibles
// Note: En production, utilisez une bibliothèque de chiffrement robuste

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
  }

  // Générer une clé de chiffrement
  async generateKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Chiffrer des données
  async encrypt(data, key) {
    try {
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(JSON.stringify(data));
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        encodedData
      );

      // Combiner IV et données chiffrées
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Erreur de chiffrement:', error);
      throw new Error('Échec du chiffrement des données');
    }
  }

  // Déchiffrer des données
  async decrypt(encryptedData, key) {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      throw new Error('Échec du déchiffrement des données');
    }
  }

  // Hacher des données (pour les mots de passe, etc.)
  async hash(data) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Générer un salt aléatoire
  generateSalt() {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
}

export const encryptionService = new EncryptionService();

// Utilitaire pour chiffrer les données médicales sensibles
export const encryptMedicalData = async (data) => {
  if (import.meta.env.VITE_NODE_ENV === 'development') {
    // En développement, on peut désactiver le chiffrement
    return data;
  }

  try {
    const key = await encryptionService.generateKey();
    const encryptedData = await encryptionService.encrypt(data, key);
    
    // En production, la clé devrait être stockée de manière sécurisée
    // (par exemple, dans un service de gestion de clés)
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    
    return {
      data: encryptedData,
      key: keyString // À ne pas faire en production !
    };
  } catch (error) {
    console.error('Erreur lors du chiffrement des données médicales:', error);
    return data; // Fallback en cas d'erreur
  }
};