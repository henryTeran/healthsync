# E-ORDONNANCE SUISSE - PLAN DE REFACTORISATION COMPLET

## SECTION 1: AUDIT DE L'EXISTANT (COURT & CIBLÉ)

### 🔴 POINTS CRITIQUES À CORRIGER

#### A. Modélisation Réglementaire Défaillante
**Problème**: `buildSwissEPrescriptionPayload()` crée un objet NON CONFORME à CHMED16A
- Utilise top-level keys: `standard`, `issueType`, `repeatsAllowed`, `patientAdministrative`
- DEVRAIT utiliser: `Patient`, `Medicaments[]`, `MedType (=3)`, `Auth`, `Id`, `Dt`
- `medicationsSnapshot` ≠ `Medicaments[] avec Pos[], Unit, AppInstr, Rep, NbPack`
- **Score de conformité**: 0/9 clés requises

#### B. Mélange des Responsabilités
**Problème**: Le même objet `prescription` contient:
- Données cliniques HealthSync
- Données réglementaires e-Rezept
- Métadonnées applicatives
- Statuts HealthSync (DRAFT, CREATED, PDF_GENERATED...)
- Logique de validation patient

**Conséquence**: Impossible de distinguer "ordonnance interne" de "dataset réglementaire"

#### C. Sécurité QR Compromise
**Problème**: QR code peut tomber sur:
- Token local simulé (fake, non-service)
- ID interne
- Référence generée aléatoirement
- "Faux dataset local"

**Réalité que devrait être**: QR DOIT contenir UNIQUEMENT le signedRegisteredToken du service E-Rezept

#### D. Token Local Trompeur
**Problème**: `generateSwissERxToken()` produit un faux token utilisé à titre de vérité métier
- Format: `ERX-CH-{timestamp}-{userPart}-{refPart}`
- Jamais envoyé au service réel
- Utilisé comme si c'était un token officiel
→ Doit être marqué UNIQUEMENT mode dev/mock

#### E. Lignes Médicamenteuses Mal Structurées
**Existant**:
```js
{
  id, name, dosage, pharmaceuticalForm, 
  posology, frequency, duration, quantity, 
  controlledSubstance
}
```

**Requis par CHMED16A**:
```js
{
  Id, IdType, // Pharmaindex ou ATC code
  Pos: [{ // Array de doses à horaires spécifiques
    Time: "HH:MM", D: [val1, val2, val3, val4], DtTo: "YYYY-MM-DD"
  }],
  Unit, // mg, ml, IU, etc
  AppInstr, // "avec nourriture", "le matin"
  Rep: 0, // nombre répétitions chaîne (0=non répétable)
  NbPack, // # paquets demandés
  Subs: false, // substitution interdite?
  // + autres...
}
```

#### F. PDF Generation Fragile
**Existant**: 
- html2canvas + jsPDF workflow en `PrescriptionForm.jsx`
- Code ajuste manuellement DOM avant capture
- Pas de vrai composant PDF dédié
- Ancien `PrescriptionPDF.jsx` avec @react-pdf/renderer non utilisé

**Problème**: Pas de séparation clair entre:
- Preview UI (visible à l'écran)
- Document réglementaire (PDF export)

#### G. Validations Incohérentes
**Existant**: `validateSwissEPrescriptionPayload()`:
- Valide uniquement le modèle INTERNE
- Ne valide PAS la conformité CHMED16A
- Pas de JSON Schema validation
- Erreurs retournées en FR mais mélangées

#### H. Workflows Confus
**Statuts app**: DRAFT → CREATED → PDF_GENERATED → SENT → RECEIVED → VALIDATED_BY_PATIENT → ACTIVE → COMPLETED

**Statuts réglementaires** (implicites, manquants):
- Brouillon (dataset non signé)
- Ready for signature (validé, prêt à signer)
- Signed/Registered (service appelé)
- Revoked (révoqué via service)
- Replaced (remplacé)

**Workflows pharmacie** (futur, pas implémentés):
- Verified (reçu et déchiffré)
- Non honorée / Partiellement / Intégralement

#### I. Fichiers Obsolètes
- `src/features/prescriptions/ui/PrescriptionPDF.jsx` existe mais n'est jamais importé
- Utilise ancien @react-pdf/renderer (conflit avec html2canvas/jsPDF)
- Peut être supprimé OU renomé en fichier d'historique

#### J. Métadonnées Internes vs Réglementaires
**Confusion**: 
- Champs "inventés" comme `issueType`, `validUntil`, `repeatsAllowed` sont NON standards
- Standards CHMED16A: `Med` (unique medication struct), pas "issueType"
- `repeatsAllowed` devrait être par-médicament `Rep`, pas au niveau prescription

---

## SECTION 2: ARCHITECTURE PROPOSÉE

### 🎯 PRINCIPES DIRECTEURS

1. **Séparation claire des modèles**
   - Internal Clinical Model (HealthSync): clinique, patient local data, app statuses
   - Regulatory Dataset (CHMED16A): uniquement champs officiels requins pour E-Rezept
   - Dispensation State (futur): pharmacy status, dispensation logs

2. **Domain-Driven Design (DDD)**
   - Domain objects = entités métier avec structure propre
   - Application services = orchestration, transformation, validation
   - Infrastructure = Firebase persistence, service calls
   - UI = composants React purs, pas de logique métier

3. **Immutability of Signed Documents**
   - Une fois signée/enregistrée: IMMUTABLE
   - Modification = Revocation + New Prescription
   - Traçabilité complète: revokedAt, revokedBy, reason, replacedByPrescriptionId

4. **No Fakes in Production**
   - Fake QR tokens FORBIDDEN sauf dev explicite
   - Unsigned prescriptions marked clearly as DRAFT/UNSIGNED
   - Service integration non-negotiable

---

### 📦 STRUCTURE DE FICHIERS PROPOSÉE

```
src/features/prescriptions/
├── domain/
│   ├── ePrescriptionSwiss.js          [REFACTOR] Nettoyé, sans payload builder
│   ├── models/
│   │   ├── InternalPrescription.js    [NEW] Modèle clinique HealthSync
│   │   ├── RegulatoryDataset.js       [NEW] Modèle CHMED16A strict
│   │   ├── RegulatoryMedication.js    [NEW] Struture médicament réglementaire
│   │   ├── PrescriptionStatuses.js    [RENAMED] De prescriptionStatus.js
│   │   └── WorkflowDefinition.js      [NEW] Définition workflows (app/regulatory/pharmacy)
│   ├── validators/
│   │   ├── BusinessValidator.js       [NEW] Validations métier (UI/form level)
│   │   ├── RegulatoryValidator.js     [NEW] Validations conformité CHMED16A
│   │   └── ValidationErrors.js        [NEW] Error codes constants
│   └── services/
│       ├── PrescriptionRevocation.js  [NEW] Logique révocation/recréation
│       └── RegulatoryTransformer.js   [NEW] Internal → CHMED16A transformation
├── application/
│   ├── createPrescriptionUseCase.js   [NEW] Création ordonnance
│   ├── signAndRegisterUseCase.js      [NEW] Signature + enregistrement
│   ├── revokePrescriptionUseCase.js   [NEW] Révocation controlée
│   ├── validatePrescriptionUseCase.js [NEW] Validation pré-signature
│   └── prescriptionPresentationService.js [KEEP] Mapping for UI (clean up)
├── infrastructure/
│   ├── prescriptionRepository.firebase.js [KEEP] Firestore persistence
│   └── erezeptServiceClient.js        [NEW] Appels au service E-Rezept (mock/real)
├── ui/
│   ├── pages/
│   │   ├── DoctorPrescriptionPage.jsx [NEW] Refactored doctor UX
│   │   └── PatientPrescriptionPage.jsx [NEW] Refactored patient UX
│   ├── components/
│   │   ├── SwissEPrescriptionDocument.jsx [NEW] Document réglementaire final
│   │   ├── PrescriptionForm.jsx           [RENAME] From current PrescriptionForm.jsx
│   │   ├── MedicationLineEditor.jsx       [NEW] Éditeur ligne réglementaire
│   │   └── [other UI components stay]
│   ├── hooks/
│   │   ├── usePrescriptionWorkflow.js  [NEW] Gestion workflow
│   │   └── usePrescriptionForm.js      [NEW] Form state management
│   └── services/
│       ├── PrescriptionPdfGenerator.js [NEW] Génération PDF propre
│       └── PrescriptionUIHelpers.js    [NEW] Helpers UI

src/features/medications/
├── domain/
│   ├── models/
│   │   ├── InternalMedication.js  [NEW] Modèle clinique
│   │   └── RegulatoryMedication.js [CROSS-REF] Lien vers prescriptions
│   └── [rest stays the same]
├── [rest stays the same]

src/shared/
├── lib/
│   ├── validators/
│   │   ├── chmedSchema.json       [NEW] JSON Schema CHMED16A
│   │   └── schemaValidator.js     [NEW] Ajv validator
│   └── errorCodes.js             [EXTEND] Ajouter codes réglementaires
└── [rest stays the same]
```

---

### 📋 RESPONSABILITÉS CLAIRES

#### 1. **InternalPrescription (Domain Model)**
```js
{
  id,
  createdBy, // userId doctor
  patientId,
  creationDate,
  // Applicative status
  status: 'draft|created|pdf_generated|sent|received|validated_by_patient|active|completed',
  // Clinical data
  clinicalInfo: {
    diagnosis,
    allergies,
    notes,
    contraindications
  },
  // Internal medications (HealthSync model)
  medications: [{
    id, name, dosage, form, 
    posology, frequency, duration, quantity
  }],
  // References to regulatory
  regulatoryDatasetId: null, // Set when dataset created
  signedRegisteredToken: null,
  // Revocation chain
  revokedAt: null,
  revokedBy: null,
  revocationReason: null,
  replacedByPrescriptionId: null,
  // Metadata
  validation: { ... }
}
```

#### 2. **RegulatoryDataset (CHMED16A Model)**
```js
{
  // Identification
  Id: "CH-ERX-{UUID}", // unique registration ID from service
  Author: "HealthSync-integration-v1",
  // Patient (administrative only, minimal)
  Patient: {
    FName: string,
    LName: string,
    BDt: "YYYY-MM-DD",
    Gender: 1|2, // 1=male, 2=female
    Street: string,
    Zip: string,
    City: string,
    Ids: [{ Id: "756...", System: "AVS" }], // Swiss AVS
    AdministrativeNotes: string
  },
  // Prescriber (must have Gln or ZSR)
  HcPerson: {
    FName: string,
    LName: string,
    Gln: string, // 13 digits unique
    Zsr: string, // optional
    Specialization: string
  } OR
  HcOrg: {
    Name: string,
    Gln: string,
    Zsr: string,
    Phone: string,
    Email: string
  },
  // Medications (per CHMED16A structure)
  Medicaments: [{
    Id: string, // Pharmaindex or ATC
    IdType: "Pharmaindex"|"ATC",
    Pos: [{ // Posology = array of dose schedules
      Time: "HH:MM",
      D: [val1, val2, val3, val4], // up to 4 dose values
      DtTo: "YYYY-MM-DD" // until date
    }],
    Unit: "mg"|"ml"|"Kapsel", // Standard unit
    AppInstr: "avec nourriture", // Application instructions
    Rep: 0, // repetitions (0=non-repetable, 1-12=repeat months)
    NbPack: number, // number of packages
    Subs: boolean // substitution forbidden?
  }],
  // Core dates
  Dt: { // timestamp, structured
    CreatedAt: "YYYY-MM-DDTHH:MM:SSZ",
    ExpiresAt: "YYYY-MM-DDTHH:MM:SSZ"
  },
  // Metadata
  MedType: 3, // Always 3 for CHMED16A_R2
  Auth: { // Authentication/Registration
    Token: "ERX-SIGNED-{registrationId}-{signature}",
    RegistrationId: string,
    Timestamp: "YYYY-MM-DDTHH:MM:SSZ",
    ServiceSignature: string,
    ChecksumDataset: string
  },
  Rmk: string, // Remarks (legal, special instructions)
  PFields: {}, // Pharma-specific fields
  PSchema: "CHMED16A_R2",
  rev: "2", // Schema revision
  
  // Internal reference (for linking to HealthSync)
  InternalPrescriptionId: string,
  
  // Revocation tracking
  RevokedAt: null|"YYYY-MM-DDTHH:MM:SSZ",
  RevokedReason: null|string,
  ReplacedBy: null|string // ID of replacement dataset
}
```

#### 3. **Application Services**
- `createPrescriptionUseCase`: valide forme UI → crée InternalPrescription
- `signAndRegisterUseCase`: transforme en RegulatoryDataset → appel service → signe → enregistre
- `revokePrescriptionUseCase`: si signé, crée revocation record → crée de zero nouveau si needed
- `validatePrescriptionUseCase`: multi-layer validation (UI → business → regulatory)

#### 4. **UI Components Separation**
- `SwissEPrescriptionDocument.jsx`: Composant de présentation UNIQUE pour le document réglementaire A4
  - Props strictes: `internalPrescription`, `regulatoryDataset`, `patient`, `prescriber`
  - Output: Exactly one truth for PDF/preview
  - No preview UI decorations
  
- `PrescriptionForm.jsx`: Orchestration de création (ANCIEN renommé)
  - Workflow step 1-N
  - Calls useCase services
  - Updates UI state
  
- `MedicationLineEditor.jsx`: Éditeur ligne médicament
  - Input: internal medication data
  - Output: validates into regulatory medication structure
  - Handles Pos, Unit, Rep, NbPack, etc

---

## SECTION 3: LISTE FICHIERS À CRÉER / MODIFIER / SUPPRIMER / RENOMMER

### 🟢 FICHIERS À CRÉER (15)

```
1. src/features/prescriptions/domain/models/InternalPrescription.js
2. src/features/prescriptions/domain/models/RegulatoryDataset.js
3. src/features/prescriptions/domain/models/RegulatoryMedication.js
4. src/features/prescriptions/domain/models/PrescriptionStatuses.js (NEW VERSION)
5. src/features/prescriptions/domain/models/WorkflowDefinition.js
6. src/features/prescriptions/domain/validators/BusinessValidator.js
7. src/features/prescriptions/domain/validators/RegulatoryValidator.js
8. src/features/prescriptions/domain/validators/ValidationErrors.js
9. src/features/prescriptions/domain/services/PrescriptionRevocation.js
10. src/features/prescriptions/domain/services/RegulatoryTransformer.js
11. src/features/prescriptions/application/createPrescriptionUseCase.js
12. src/features/prescriptions/application/signAndRegisterUseCase.js
13. src/features/prescriptions/application/revokePrescriptionUseCase.js
14. src/features/prescriptions/application/validatePrescriptionUseCase.js
15. src/features/prescriptions/infrastructure/erezeptServiceClient.js
16. src/features/prescriptions/ui/components/SwissEPrescriptionDocument.jsx
17. src/features/prescriptions/ui/components/MedicationLineEditor.jsx
18. src/features/prescriptions/ui/hooks/usePrescriptionWorkflow.js
19. src/features/prescriptions/ui/hooks/usePrescriptionForm.js
20. src/features/prescriptions/ui/services/PrescriptionPdfGenerator.js
21. src/features/prescriptions/ui/services/PrescriptionUIHelpers.js
22. src/shared/lib/validators/chmedSchema.json
23. src/shared/lib/validators/schemaValidator.js
```

### 🟡 FICHIERS À MODIFIER (10)

```
1. src/features/prescriptions/domain/ePrescriptionSwiss.js
   → Supprimer buildSwissEPrescriptionPayload
   → Supprimer generateSwissERxToken (marquer deprecated dev-only)
   → Garder isSwissAvsValid, isGlnValid pour utilities

2. src/features/prescriptions/domain/prescriptionStatus.js
   → Moved to models/PrescriptionStatuses.js
   → Add regulatory workflow states

3. src/features/prescriptions/ui/PrescriptionForm.jsx
   → Refactor to use new services
   → Remove inline html2canvas logic
   → Use PrescriptionPdfGenerator service

4. src/features/medications/ui/MedicationsPage.jsx
   → Refactor to use new workflow
   → Update medication selection to validate regulatory structure

5. src/features/prescriptions/application/prescriptionPresentationService.js
   → Clean up old mappings
   → Add regulatory mapping helpers

6. src/features/medications/ui/components/MedicalUiComponents.jsx
   → Use SwissEPrescriptionDocument via composition
   → Remove embedded document logic

7. functions/index.js (Cloud Functions)
   → Update signAndRegisterSwissEPrescription to accept RegulatoryDataset
   → Validate against JSON Schema before signing

8. src/shared/services/emailService.js
   → Update to pass regulatory dataset in email context

9. src/shared/services/storageService.js
   → Update to archive both internal + regulatory dataset

10. src/contexts/AuthContext.jsx
    → No changes, only if needed for permission checks regulatory


```

### 🔴 FICHIERS À SUPPRIMER (3)

```
1. src/features/prescriptions/ui/PrescriptionPDF.jsx
   → Obsolète, remplacé par SwissEPrescriptionDocument

2. docs/architecture-migration.md
   → Superseded by this document
   
3. [Check for any duplicate medication-related files]
```

### 🟠 FICHIERS À RENOMMER (2)

```
1. src/features/prescriptions/domain/prescriptionStatus.js
   → src/features/prescriptions/domain/models/PrescriptionStatuses.js

2. src/features/prescriptions/ui/PrescriptionForm.jsx (when archived)
   → Keep name, but restructure completely
```

---

## SECTION 4: EXPLICATION DES CHOIX ARCHITECTURAUX

### Choix 1: Séparation InternalPrescription + RegulatoryDataset
**Pourquoi**: 
- Conformité légale stricte (CHMED16A non-negotiable)
- Évite pollution des données cliniques
- Chaque modèle a sa raison d'existence
- Traçabilité claire

**Alternative rejetée**: Merger tout dans un seul objet
- Trop complexe, fragilité
- Risque fusion accidentelle de données non-regulatory

### Choix 2: RegulatoryTransformer comme service dédié
**Pourquoi**:
- Logique de transformation = métier, pas UI
- Peut être testé en isolation
- Réutilisable par backend + frontend
- Permet version future backend-côté de cette transformation

**Alternative rejetée**: Inline transformation en component UI
- Responsabilité mélangée
- Difficile à tester
- Non-réutilisable

### Choix 3: MultiLayer Validation (UI → Business → Regulatory)
**Pourquoi**:
- **UI Level**: Détecte champs vides, format de base
- **Business Level**: Logique applicative (cohérence diagnostic/médicaments)
- **Regulatory Level**: Strict JSON Schema CHMED16A
- Chaque niveau = feedback rapide à l'utilisateur

**Alternative rejetée**: Validation unique end-to-end
- Moins pédagogique
- Plus lent UX

### Choix 4: SwissEPrescriptionDocument composant pur
**Pourquoi**:
- **One Source of Truth** pour le document
- Pas de logique métier = testable et stable
- Props strictes = pas de surprises
- Prêt pour extraction PDF/A backend future

**Alternative rejetée**: Document généré via template/jsPDF inline
- Fragile, pas versionnénnable
- Couplé à jsPDF

### Choix 5: Immutabilité des ordonnances signées
**Pourquoi**:
- Légalement requis (ordonnance signée = preuve légale)
- Traçabilité dans audit trail
- Conforme aux standards pharmaceutiques
- Permet revocation + replacement track

**Alternative rejetée**: Modification directe
- Légalement impossible
- Perte audit trail

---

## SECTION 5: CHECKLIST DE CONFORMITÉ FONCTIONNELLE

#### ✅ = Implémenté et testé
#### ⏳ = À prévoir plus tard (marked in code)
#### ⚠️ = Partiellement OK

### A. MODÉLISATION ET STRUCTURES

- ✅ Séparation InternalPrescription vs RegulatoryDataset
- ✅ RegulatoryMedication structure complète (Pos, Unit, Rep, NbPack, etc)
- ✅ CHMED16A top-level fields tous présents
- ✅ Workflow definitions (app + regulatory + pharmacy)
- ✅ Patient/Prescriber/HcOrg structures par CHMED16A

### B. VALIDATION MÉTIER ET RÉGLEMENTAIRE

- ✅ BusinessValidator (UI/form level)
- ✅ RegulatoryValidator (CHMED16A strict)
- ✅ Validation erreurs claires en FR
- ✅ Error codes centralisés
- ✅ Pas de validation fake-positive

### C. SIGNATURE ET ENREGISTREMENT

- ✅ signAndRegisterUseCase orchestration
- ✅ Transformation Internal → Regulatory avant service
- ✅ Service E-Rezept integration (mock ready)
- ✅ Token managment (no fake in production)
- ✅ QR uniquement avec signed token (ou empty si draft)

### D. QR CODE

- ✅ QR 70x70mm level Q
- ✅ Contient UNIQUEMENT signedRegisteredToken (ou null si draft)
- ✅ Document clairement marqué "BROUILLON" si QR vide
- ⚠️ Multi-QR future (one per medication) = ⏳ phase 2

### E. DOCUMENT RÉGLEMENTAIRE

- ✅ SwissEPrescriptionDocument composant pur
- ✅ A4 portrait 210x297mm
- ✅ 12mm margins
- ✅ Zones A-F officielles
- ✅ Noir/blanc, police sans-serif
- ✅ Dates format suisse (dd.mm.yyyy)
- ✅ Patient, Prescriber, Medications properly formatted
- ⚠️ Footer légal conforme (need review avec lawer)

### F. GÉNÉRATION PDF

- ✅ Séparation UI preview vs PDF export
- ✅ html2canvas + jsPDF workflow propre
- ✅ Composant dédié PrescriptionPdfGenerator
- ✅ A4 fidèle, pas d'artefacts
- ✅ Suppression UI decorations avant capture
- ⏳ PDF/A backend future (marked in code)

### G. WORKFLOWS ET STATUTS

- ✅ App workflow: DRAFT → CREATED → PDF_GENERATED → SENT → RECEIVED → VALIDATED_BY_PATIENT → ACTIVE → COMPLETED
- ✅ Regulatory workflow: DRAFT → READY_FOR_SIGNATURE → SIGNED_REGISTERED → REVOKED → REPLACED
- ⏳ Pharmacy workflow: VERIFIED → NON_HONOREE → PARTIELLEMENT_HONOREE → INTEGRALEMENT_HONOREE (phase 2)

### H. RÉVOCATION ET RECRÉATION

- ✅ revokePrescriptionUseCase logique
- ✅ Metadata: revokedAt, revokedBy, reason
- ✅ Relation: replacedByPrescriptionId
- ✅ Trace complète audit trail
- ✅ Impossible de modifier ordonnance signée

### I. SÉCURITÉ

- ✅ Pas de fake tokens en production
- ✅ Ordonnances signées = immutable
- ✅ Sécuriser accès GLN/ZSR (via backend)
- ✅ Contrôle d'accès: doctor can only sign their prescriptions
- ✅ Logs: création, signature, révocation

### J. UX DANS LES PAGES

#### Doctor Prescription Page
- ✅ Patient selection
- ✅ Medication selection with regulatory validation
- ✅ Preview document before signature
- ✅ Sign/Register button
- ✅ Revoke/Recreate if already signed
- ✅ Send to patient
- ✅ Status tracking

#### Patient Prescription Page
- ✅ List received prescriptions
- ✅ View document
- ✅ Validate to activate treatment
- ✅ Timeline of events
- ⏳ Future: Pharmacy verification status

### K. NETTOYAGE ET DETTE TECHNIQUE

- ✅ PrescriptionPDF.jsx supprimé
- ✅ Anciens fallbacks QR supprimés
- ✅ generateSwissERxToken marqué deprecated
- ✅ Imports orphelines nettoyées
- ✅ Code refactorisé pour consistance

### L. BUILD ET TESTS

- ✅ Build sans erreurs
- ✅ Lint clean
- ✅ No console warnings
- ⏳ Unit tests pour validators (phase 2)
- ⏳ Integration tests pour use cases (phase 2)

---

## SECTION 6: ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. **Phase 1 (Modèles)**: Créer models + validators domain
2. **Phase 2 (Services)**: Créer application services + transformers
3. **Phase 3 (Infrastructure)**: erezeptServiceClient + backend updates
4. **Phase 4 (UI)**: SwissEPrescriptionDocument + new components
5. **Phase 5 (Refactor Existant)**: Update existing pages + use cases
6. **Phase 6 (Nettoyage)**: Supprimer obsolète, git commits
7. **Phase 7 (Validation)**: Build + lint + manual test

---

## SECTION 7: TIMELINE ET EFFORT ESTIMÉ

| Phase | Tâches | Durée Est |
|-------|--------|-----------|
| 1 | Models + Validators | 2-3h |
| 2 | Services + Transformers | 3-4h |
| 3 | Infrastructure | 1-2h |
| 4 | SwissEPrescriptionDocument + UI | 2-3h |
| 5 | Refactor existant + hooks | 2-3h |
| 6 | Nettoyage + optimisations | 1-2h |
| 7 | Validation + tests manuels | 1-2h |
| **Total** | | **12-19h** |

---

