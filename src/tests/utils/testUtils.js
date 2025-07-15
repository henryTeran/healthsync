import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

// Wrapper personnalisé pour les tests
const AllTheProviders = ({ children }) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

// Fonction de rendu personnalisée
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Mock des services Firebase
export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  },
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
};

export const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
};

// Données de test
export const mockUserData = {
  doctor: {
    uid: 'doctor-1',
    email: 'doctor@test.com',
    firstName: 'Dr. John',
    lastName: 'Doe',
    type: 'doctor',
    medicalLicense: '12345678901',
    department: 'Cardiologie'
  },
  patient: {
    uid: 'patient-1',
    email: 'patient@test.com',
    firstName: 'Jane',
    lastName: 'Smith',
    type: 'patient',
    age: 30,
    allergies: 'Aucune'
  }
};

export const mockMedication = {
  id: 'med-1',
  name: 'Paracétamol',
  dosage: '500mg',
  frequency: '2 fois par jour',
  duration: '7 jours',
  startDate: '2024-01-01',
  endDate: '2024-01-07'
};

export const mockPrescription = {
  id: 'prescription-1',
  createdBy: 'doctor-1',
  patientId: 'patient-1',
  medications: [mockMedication],
  status: 'sent',
  creationDate: '2024-01-01T10:00:00Z'
};

// Utilitaires de test
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };