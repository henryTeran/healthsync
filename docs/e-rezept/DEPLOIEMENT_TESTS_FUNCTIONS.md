# Déploiement & tests — Function e-Rezept

## Objectif
Valider en production l’appel de la Cloud Function `signAndRegisterSwissEPrescription` et éliminer les erreurs `404/CORS`.

## Symptôme observé
- Requête vers `https://us-central1-<project>.cloudfunctions.net/signAndRegisterSwissEPrescription`
- Erreur navigateur: `CORS Access-Control-Allow-Origin manquant`
- Code `404`

> En pratique, ici le `CORS` est une **conséquence**: la vraie cause est souvent `404` (fonction absente/non déployée dans le bon projet/région).

---

## 1) Vérifier le projet Firebase actif
Depuis la racine du repo:

```bash
firebase use
firebase projects:list
```

Confirmer que le projet cible est bien `healthsync-ef94b`.

---

## 2) Installer dépendances Functions et lint

```bash
cd functions
npm install
npm run lint
cd ..
```

---

## 3) Déployer la function e-Rezept
Option ciblée (recommandée):

```bash
firebase deploy --only functions:signAndRegisterSwissEPrescription
```

Option complète codebase functions:

```bash
firebase deploy --only functions
```

Attendu: présence de `signAndRegisterSwissEPrescription` dans le résumé de déploiement.

---

## 4) Vérifier en console Firebase
- Aller sur **Functions**
- Vérifier:
  - Nom: `signAndRegisterSwissEPrescription`
  - Région: `us-central1`
  - Statut: Active

Si la région diffère de `us-central1`, l’URL changera.

---

## 5) Tester côté application
1. Ouvrir l’app (session médecin authentifiée)
2. Aller sur création/mise à jour ordonnance
3. Remplir champs e-Rezept minimaux
4. Créer/mettre à jour

Attendu:
- Plus d’erreur `404/CORS`
- `signedRegisteredToken` injecté automatiquement
- `registration` présent dans la prescription (id, timestamp, statut)

---

## 6) Vérifier logs Functions

```bash
cd functions
npm run logs
```

Chercher la ligne:
- `e-Rezept dataset signed and registered`

---

## 7) Arbre de diagnostic rapide

### Cas A — `404 + CORS`
Cause probable: fonction non déployée (ou mauvais projet/région).
- Refaire étape 1 + 3 + 4.

### Cas B — `unauthenticated`
Cause: utilisateur non connecté côté app.
- Reconnexion + retest.

### Cas C — `invalid-argument`
Cause: payload incomplet.
- Vérifier champs requis e-Rezept (dates, patient, médicaments, etc.).

### Cas D — `failed-precondition`
Cause: règle métier (ex. stupéfiants) rejetée.
- Corriger données ordonnance.

---

## 8) Checklist finale de validation
- [ ] Function visible en console Firebase
- [ ] Région correcte (`us-central1`)
- [ ] App authentifiée médecin
- [ ] Création/mise à jour ordonnance sans `404/CORS`
- [ ] Token signé généré automatiquement
- [ ] Logs Functions confirment la signature/enregistrement

---

## Notes techniques
- L’appel frontend passe via `httpsCallable(functions, "signAndRegisterSwissEPrescription")`.
- Le client ne doit pas appeler directement une URL HTTP custom pour cette fonction callable.
- En local, vérifier aussi `VITE_USE_FIREBASE_EMULATORS=true` si test émulateurs requis.
