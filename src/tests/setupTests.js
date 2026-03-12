import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto pour les tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn().mockReturnValue(new Uint8Array(16)),
    subtle: {
      generateKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
      digest: jest.fn(),
      exportKey: jest.fn()
    }
  }
});

// Mock console.error pour les tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Nettoyage après chaque test
afterEach(() => {
  jest.clearAllMocks();
});