# Checklist de conformité e-Rezept Suisse

## Sources utilisées
- `erss_selbstdeklaration_formular.docx.docx` (extraction texte partielle)
- Implémentation applicative actuelle (génération, validation, UI, workflow)

## Limite de cette version
- Les deux PDFs fournis ne sont pas textuellement extractibles de manière fiable (contenu binaire/encodage).
- Cette matrice est donc **provisoire** et basée sur les exigences explicites visibles dans la Selbstdeklaration + code.

## Matrice exigences → statut

| Exigence e-Rezept (source DOCX) | Statut | Évidence code | Remarque |
|---|---|---|---|
| Le e-Rezept est un dataset **signé et enregistré**, représentable en QR | **Partiel** | `src/features/prescriptions/domain/ePrescriptionSwiss.js` | Token signé/enregistré requis + `qrPayload` + `datasetChecksum`; signature cryptographique réelle côté service externe non intégrée.
| Standard CHMED16 / CHMED16A | **OK** | `src/features/prescriptions/domain/ePrescriptionSwiss.js` | `chmedVersion: CHMED16A_R2` injecté dans payload.
| Le QR doit contenir uniquement le dataset signé/enregistré | **Partiel** | `src/features/prescriptions/domain/ePrescriptionSwiss.js` | `qrPayload` contient aussi des métadonnées techniques (`prescriptionId`, etc.). À aligner strictement si exigence normative stricte.
| Les stupéfiants (BetmVV-EDI) ne passent pas par e-Rezept | **OK** | `src/features/prescriptions/domain/ePrescriptionSwiss.js`, `src/features/medications/ui/MedicationsPage.jsx` | Blocage validation + contrôle UI + message explicite.
| Un e-Rezept signé est **immuable** | **OK** | `src/features/medications/ui/MedicationsPage.jsx` | Statuts immuables et interdiction d’édition directe.
| Modification via **revoke + recréation** | **OK** | `src/features/medications/ui/MedicationsPage.jsx` | Flux révocation obligatoire avec motif, puis nouvelle ordonnance liée.
| Afficher explicitement l’échec de signature technique | **À faire** | `src/features/medications/ui/MedicationsPage.jsx` | Messages d’erreur génériques; pas de gestion dédiée d’un endpoint de signature externe.
| Transmission via connexions sécurisées | **Partiel** | `src/providers/firebase.js`, infra Firebase | HTTPS/TLS implicite via Firebase; pas de preuve de canal e-Rezept externe dédié.
| Conformité HMG / protection des données / minimisation | **Partiel** | `firestore.rules`, payload eRx | Amélioration nette mais analyse légale formelle non faite.
| Patient peut recevoir e-Rezept papier ou digital | **OK** | `src/features/prescriptions/ui/PrescriptionForm.jsx`, `src/features/medications/ui/components/MedicalUiComponents.jsx` | Génération PDF + flux numérique présents.
| Le patient choisit la pharmacie destinataire | **À faire** | — | Fonctionnalité de choix de pharmacie non visible côté app.
| Vérification `verify` avant dispensation (pharmacie) | **À faire / Hors périmètre** | — | Exigence orientée système officine/POS, non implémentée ici.
| Archivage obligatoire du e-Rezept (QR/dataset/PDF) | **Partiel** | Firestore + PDF généré | Stockage opérationnel existant mais politique d’archivage réglementaire non formalisée.
| Alerte si ordonnance totalement délivrée puis nouvelle délivrance | **À faire / Hors périmètre** | — | Cas d’usage pharmacie/POS, non présent côté module prescripteur.

## Contrôles métier déjà en place
- Dates: émission obligatoire, validité obligatoire, cohérence `validUntil >= issuedAt`.
- Identifiants: GLN format 13 chiffres, AVS contrôlé, prescripteur requis (GLN/RCC/ID pro).
- Médication: au moins 1 médicament, données minimales obligatoires, stupéfiants interdits.
- Workflow: immutabilité post-émission et révocation motivée avant recréation.

## Écarts prioritaires (ordre recommandé)
1. Brancher un vrai service de signature/registration e-Rezept et journaliser précisément les erreurs de signature.
2. Aligner strictement le contenu QR avec la règle « uniquement dataset signé/enregistré ».
3. Ajouter un module de destination pharmacie (choix patient + traçabilité d’envoi).
4. Documenter la politique d’archivage réglementaire (durées, format, audit trail).
5. Ajouter une matrice juridique HMG/LPD séparée (validation conformité légale formelle).
