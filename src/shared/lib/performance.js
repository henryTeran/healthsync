// Utilitaires de performance

// Debounce pour limiter les appels de fonction
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttle pour limiter la fréquence d'exécution
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy loading pour les images
export const lazyLoadImage = (src, placeholder = '/placeholder.jpg') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(placeholder);
    img.src = src;
  });
};

// Cache simple en mémoire
class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      // Déplacer vers la fin (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Supprimer le plus ancien
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    return this.cache.has(key);
  }
}

export const memoryCache = new MemoryCache();

// Hook pour la pagination infinie
export const useInfiniteScroll = (callback, hasMore) => {
  useEffect(() => {
    const handleScroll = throttle(() => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
        && hasMore
      ) {
        callback();
      }
    }, 200);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, hasMore]);
};

// Mesurer les performances
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    // En production, envoyer à un service de monitoring
    if (import.meta.env.VITE_NODE_ENV === 'production') {
      // Envoyer les métriques à un service comme DataDog, New Relic, etc.
    }
    
    return result;
  };
};

// Optimisation des re-renders React
export const shallowEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

// Préchargement des ressources
export const preloadResource = (href, as = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

// Compression des données avant stockage
export const compressData = (data) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (error) {
    console.error('Erreur de compression:', error);
    return data;
  }
};

export const decompressData = (compressedData) => {
  try {
    return JSON.parse(atob(compressedData));
  } catch (error) {
    console.error('Erreur de décompression:', error);
    return compressedData;
  }
};