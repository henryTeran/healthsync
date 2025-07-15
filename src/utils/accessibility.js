// Utilitaires d'accessibilité

// Annoncer des changements aux lecteurs d'écran
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Nettoyer après 1 seconde
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Gérer le focus pour la navigation au clavier
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  
  // Retourner une fonction de nettoyage
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Vérifier le contraste des couleurs
export const checkColorContrast = (foreground, background) => {
  // Convertir les couleurs hex en RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculer la luminance relative
  const getLuminance = (rgb) => {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) return null;

  const fgLuminance = getLuminance(fgRgb);
  const bgLuminance = getLuminance(bgRgb);

  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                   (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio: contrast,
    AA: contrast >= 4.5,
    AAA: contrast >= 7,
    AALarge: contrast >= 3,
    AAALarge: contrast >= 4.5
  };
};

// Hook pour gérer les raccourcis clavier
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const modifiers = {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey
      };

      shortcuts.forEach(({ key: shortcutKey, modifiers: shortcutModifiers = {}, action }) => {
        const keyMatches = key === shortcutKey.toLowerCase();
        const modifiersMatch = Object.keys(shortcutModifiers).every(
          mod => modifiers[mod] === shortcutModifiers[mod]
        );

        if (keyMatches && modifiersMatch) {
          event.preventDefault();
          action(event);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Composant pour les textes cachés aux lecteurs d'écran
export const ScreenReaderOnly = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Composant pour ignorer le contenu des lecteurs d'écran
export const AriaHidden = ({ children }) => (
  <span aria-hidden="true">{children}</span>
);