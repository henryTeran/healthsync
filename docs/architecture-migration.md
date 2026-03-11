# Migration vers une architecture pro (feature + clean layers)

## Objectif
Mettre en place une architecture scalable et maintenable sans casser l'application existante.

## Structure cible

```text
src/
  app/                  # bootstrap global (router, providers, guards)
  shared/               # composants/ui/transversal utils/config
  features/
    medications/
      domain/           # règles métier pures
      application/      # use-cases
      infrastructure/   # accès Firestore/Firebase
      ui/               # composants/pages/hooks de la feature
```

## Règles de dépendance
- ui -> application -> domain
- infrastructure implémente les ports utilisés par application/domain
- ui ne doit pas appeler Firestore directement

## Ce qui est déjà migré
- Couche `app` nettoyée:
  - `src/app/router/AppRouter.jsx`
  - `src/app/layouts/PrivateLayout.jsx`
  - `src/app/layouts/Header.jsx`
  - `src/app/layouts/Sidebar.jsx`
  - `src/app/router/guards/PrivateRoute.jsx`
  - `src/App.jsx` réduit au bootstrap (toaster + auth loading + router)

- Couche `shared` consolidée:
  - UI partagée:
    - `src/shared/ui/LoadingSpinner.jsx`
    - `src/shared/ui/ErrorBoundary.jsx`
    - `src/shared/ui/AccessibleModal.jsx`
  - Helpers transverses:
    - `src/shared/lib/accessibility.js`
    - `src/shared/lib/validation.js`
    - `src/shared/lib/performance.js`
    - `src/shared/lib/errorHandler.js`
  - Sécurité:
    - `src/shared/security/encryption.js`

- Feature `medications` créée en couches:
  - `src/features/medications/domain/medicationSchedule.js`
  - `src/features/medications/application/medicationUseCases.js`
  - `src/features/medications/infrastructure/medicationRepository.firebase.js`
  - `src/features/medications/index.js`
  - `src/features/medications/ui/MedicationSearch.jsx`

- Feature `prescriptions` créée en couches:
  - `src/features/prescriptions/application/prescriptionUseCases.js`
  - `src/features/prescriptions/infrastructure/prescriptionRepository.firebase.js`
  - `src/features/prescriptions/index.js`
  - `src/features/prescriptions/ui/PrescriptionForm.jsx`
  - `src/features/prescriptions/ui/PrescriptionPDF.jsx`
  - `src/features/prescriptions/ui/PrescriptionTable.jsx`

- Feature `notifications` créée en couches:
  - `src/features/notifications/application/notificationUseCases.js`
  - `src/features/notifications/infrastructure/notificationRepository.firebase.js`
  - `src/features/notifications/index.js`
  - `src/features/notifications/ui/NotificationsPage.jsx`
  - `src/features/notifications/ui/NotificationWidget.jsx`

- Feature `auth` créée en couches:
  - `src/features/auth/application/authUseCases.js`
  - `src/features/auth/application/AuthService.js`
  - `src/features/auth/domain/RegistrationService.js`
  - `src/features/auth/infrastructure/authRepository.firebase.js`
  - `src/features/auth/index.js`
  - `src/features/auth/ui/LoginPage.jsx`
  - `src/features/auth/ui/RegisterPage.jsx`

- Feature `profile` créée en couches:
  - `src/features/profile/application/profileUseCases.js`
  - `src/features/profile/application/doctorPatientUseCases.js`
  - `src/features/profile/infrastructure/doctorPatientRepository.firebase.js`
  - `src/features/profile/infrastructure/profileRepository.firebase.js`
  - `src/features/profile/index.js`

- Feature `dashboard` complétée en couches:
  - `src/features/dashboard/application/dashboardUseCases.js`
  - `src/features/dashboard/infrastructure/dashboardRepository.firebase.js`
  - `src/features/dashboard/index.js`

- Domain model unifié:
  - `src/shared/domain/User.js`
  - `src/features/chat/domain/ChatMessage.js`
  - `src/features/appointments/domain/Appointment.js`
  - `src/features/reminders/domain/Reminder.js`
  - `src/features/symptoms/domain/Symptom.js`

- Services transverses déplacés vers `shared`:
  - `src/shared/services/documedisService.js`
  - `src/shared/services/emailService.js`
  - `src/shared/services/storageService.js`

- Feature `chat` créée en couches:
  - `src/features/chat/application/chatUseCases.js`
  - `src/features/chat/infrastructure/chatRepository.firebase.js`
  - `src/features/chat/index.js`
  - `src/features/chat/ui/ChatPage.jsx`
  - `src/features/chat/ui/ChatInterface.jsx`
  - `src/features/chat/ui/ContactList.jsx`

- Feature `appointments` créée en couches:
  - `src/features/appointments/application/appointmentUseCases.js`
  - `src/features/appointments/infrastructure/appointmentRepository.firebase.js`
  - `src/features/appointments/index.js`
  - `src/features/appointments/ui/Appointments.jsx`
  - `src/features/appointments/ui/AddAppointment.jsx`

- Feature `symptoms` créée en couches:
  - `src/features/symptoms/application/symptomUseCases.js`
  - `src/features/symptoms/infrastructure/symptomRepository.firebase.js`
  - `src/features/symptoms/index.js`
  - `src/features/symptoms/ui/SymptomsPage.jsx`
  - `src/features/symptoms/ui/SymptomForm.jsx`

- Feature `reminders` créée en couches:
  - `src/features/reminders/application/reminderUseCases.js`
  - `src/features/reminders/infrastructure/reminderRepository.firebase.js`
  - `src/features/reminders/index.js`
  - `src/features/reminders/ui/RemindersPage.jsx`
  - `src/features/reminders/ui/CreateReminder.jsx`
  - `src/features/reminders/ui/ReminderList.jsx`

- UI `medications` migrée vers la feature:
  - `src/features/medications/ui/MedicationsPage.jsx`
  - `src/features/medications/ui/MedicationsPrescriptionPage.jsx`
  - `src/features/medications/ui/PrescriptionHistoryPage.jsx`
  - `src/features/medications/ui/MedicationCard.jsx`

- UI `symptoms` finalisée dans la feature:
  - `src/features/symptoms/ui/SymptomCard.jsx`
  - `src/features/symptoms/ui/SymptomChartPage.jsx`

- UI `dashboard` déplacée vers feature:
  - `src/features/dashboard/ui/StatsCard.jsx`
  - `src/features/dashboard/ui/RecentActivity.jsx`
  - `src/features/dashboard/ui/QuickActions.jsx`
  - `src/features/dashboard/ui/DoctorDashboard.jsx`
  - `src/features/dashboard/ui/PatientDashboard.jsx`

- UI `profile` déplacée vers feature:
  - `src/features/profile/ui/ProfileCard.jsx`
  - `src/features/profile/ui/ProfilePage.jsx`
  - `src/features/profile/ui/EditProfile.jsx`
  - `src/features/profile/ui/PatientProfile.jsx`
  - `src/features/profile/ui/doctor/AppointmentsRequestTabe.jsx`
  - `src/features/profile/ui/doctor/DoctorProfile.jsx`
  - `src/features/profile/ui/doctor/FollowedTable.jsx`
  - `src/features/profile/ui/doctor/FollowRequestsTable.jsx`
  - `src/features/profile/ui/doctor/ListeDoctorsProfiles.jsx`
  - `src/features/profile/ui/patient/ListDoctorAvailable.jsx`
  - `src/features/profile/ui/patient/ListePatientsProfiles.jsx`

- Firebase unifié:
  - point d'entree unique dans `src/providers/firebase.js`
  - `src/config/firebase.js` supprime

- UI decouplee de Firebase sur les vues critiques:
  - `src/app/layouts/Header.jsx`
  - `src/features/profile/ui/PatientProfile.jsx`
  - `src/features/profile/ui/doctor/FollowRequestsTable.jsx`
  - `src/features/profile/ui/doctor/FollowedTable.jsx`
  - `src/features/profile/ui/doctor/ListeDoctorsProfiles.jsx`
  - `src/features/profile/ui/doctor/AppointmentsRequestTabe.jsx`
  - `src/features/profile/ui/patient/ListePatientsProfiles.jsx`

- Fichiers lourds commences a etre decoupes:
  - `src/features/auth/ui/RegisterPage.jsx`
  - `src/features/auth/ui/RegisterSections.jsx`

## Purge effectuée
- Supprimé: `src/services/medicationService_.js` (legacy non référencé)
- Supprimé: `src/components/PrescriptionHistory.jsx` (doublon non référencé)
- Supprimé: `src/components/NotificationPreferences.jsx` (composant non référencé)
- Supprimé: `src/pages/NotificationsHeader/Notifications.jsx` (migré vers feature UI)
- Supprimé: `src/components/NotificationWidget.jsx` (migré vers feature UI)
- Supprimé: `src/components/PrescriptionPopup.jsx` (composant non référencé)
- Supprimé: `src/components/MedicationGantt.jsx` (composant non référencé)
- Supprimé: `src/components/ChartWidget.jsx` (composant non référencé)
- Supprimé: `src/components/ChatComponent.jsx` (composant non référencé)
- Supprimé: `src/components/StatsCard.jsx` (composant legacy non référencé)
- Supprimé: `src/pages/Chat/Chat.jsx` (migré vers feature UI)
- Supprimé: `src/components/chat/ChatInterface.jsx` (migré vers feature UI)
- Supprimé: `src/components/chat/ContactList.jsx` (migré vers feature UI)
- Supprimé: `src/pages/Appointment/Appointments.jsx` (migré vers feature UI)
- Supprimé: `src/pages/Appointment/AddAppointment.jsx` (migré vers feature UI)
- Supprimé: `src/pages/Symptoms/Symptoms.jsx` (migré vers feature UI)
- Supprimé: `src/components/SymptomForm.jsx` (migré vers feature UI)
- Supprimé: `src/pages/Reminders/RemindersPage.jsx` (migré vers feature UI)
- Supprimé: `src/components/CreateReminder.jsx` (migré vers feature UI)
- Supprimé: `src/components/ReminderList.jsx` (migré vers feature UI)
- Supprimé: `src/pages/medications/Medications.jsx` (migré vers feature UI)
- Supprimé: `src/pages/medications/MedicationsPrescription.jsx` (migré vers feature UI)
- Supprimé: `src/pages/medications/PrescriptionHistory.jsx` (migré vers feature UI)
- Supprimé: `src/components/medications/MedicationCard.jsx` (migré vers feature UI)
- Supprimé: `src/components/symptoms/SymptomCard.jsx` (migré vers feature UI)
- Supprimé: `src/components/SymptomChart.jsx` (migré vers feature UI)
- Supprimé: `src/components/dashboard/StatsCard.jsx` (migré vers feature UI)
- Supprimé: `src/components/dashboard/RecentActivity.jsx` (migré vers feature UI)
- Supprimé: `src/components/dashboard/QuickActions.jsx` (migré vers feature UI)
- Supprimé: `src/components/profile/ProfileCard.jsx` (migré vers feature UI)
- Supprimé: `src/pages/Dashboard/DoctorDashboard.jsx` (migré vers feature UI)
- Supprimé: `src/pages/Dashboard/PatientDashboard.jsx` (migré vers feature UI)
- Supprimé: `src/components/Header.jsx` (migré vers app layout)
- Supprimé: `src/components/Sidebar.jsx` (migré vers app layout)
- Supprimé: `src/components/PrivateRoute.jsx` (migré vers app router guard)
- Supprimé: `src/components/ui/LoadingSpinner.jsx` (migré vers shared UI)
- Supprimé: `src/components/ui/ErrorBoundary.jsx` (migré vers shared UI)
- Supprimé: `src/components/ui/AccessibleModal.jsx` (migré vers shared UI)
- Supprimé: `src/utils/accessibility.js` (migré vers shared lib)
- Supprimé: `src/utils/validation.js` (migré vers shared lib)
- Supprimé: `src/utils/performance.js` (migré vers shared lib)
- Supprimé: `src/utils/errorHandler.js` (migré vers shared lib)
- Supprimé: `src/utils/encryption.js` (migré vers shared security)
- Supprimé: `src/services/chatService.js` (façade devenue inutile)
- Supprimé: `src/services/patientDashboardService.js` (service legacy non référencé)
- Supprimé: `src/services/secureApiService.js` (service non référencé)
- Supprimé: `src/services/puppeteerService.js` (service non référencé)
- Supprimé: `src/services/profileService.js` (façade remplacée par imports directs de `src/features/profile`)
- Supprimé: `src/services/appointmentService.js` (façade remplacée par imports directs de `src/features/appointments`)
- Supprimé: `src/services/notificationService.js` (façade remplacée par imports directs de `src/features/notifications`)
- Supprimé: `src/services/symptomService.js` (façade remplacée par imports directs de `src/features/symptoms`)
- Supprimé: `src/services/reminderService.js` (façade remplacée par imports directs de `src/features/reminders`)
- Supprimé: `src/services/authService.js` (façade migrée vers `src/features/auth/application/AuthService.js`)
- Supprimé: `src/services/registerService.js` (validation déplacée vers `src/features/auth/domain/RegistrationService.js`)
- Supprimé: `src/services/doctorServices.js` (migré vers `src/features/profile/application/doctorPatientUseCases.js`)
- Supprimé: `src/services/patientServices.js` (migré vers `src/features/profile/application/doctorPatientUseCases.js`)
- Supprimé: `src/services/followService.js` (migré vers `src/features/profile/application/doctorPatientUseCases.js`)
- Supprimé: `src/services/medicationService.js` (façade remplacée par imports directs de `src/features/medications`)
- Supprimé: `src/services/prescriptionService.js` (façade remplacée par imports directs de `src/features/prescriptions`)
- Supprimé: `src/services/documedisService.js` (déplacé vers `src/shared/services/documedisService.js`)
- Supprimé: `src/services/emailService.js` (déplacé vers `src/shared/services/emailService.js`)
- Supprimé: `src/services/storageService.js` (déplacé vers `src/shared/services/storageService.js`)
- Supprimé: `src/pages/Profile/**` (migré vers `src/features/profile/ui/**`)
- Supprimé: `src/pages/WithNavigation.jsx` (remplacé par `src/app/router/WithNavigation.jsx`)
- Supprimé: `src/models/` (modèles déplacés vers `features/*/domain` et `src/shared/domain`)
- Supprimé: `src/config/firebase.js` (fusionné dans `src/providers/firebase.js`)

## Normalisation legacy (naming/routes)
- Renommé: `src/pages/Symtoms/Symptoms.jsx` -> `src/features/symptoms/ui/SymptomsPage.jsx`
- Renommé: `src/pages/medications/Medications_.jsx` -> `src/features/medications/ui/MedicationsPrescriptionPage.jsx`
- Route canonique ajoutée: `/medications/prescription/:prescriptionId?`
- Route canonique ajoutée: `/symptoms-analytics`
- Alias legacy supprimés: `/medications_/:prescriptionId?` et `/symptoms_analytic`
- Navigation interne mise à jour vers les routes canoniques (`Sidebar`, `QuickActions`, `NotificationWidget`)

## Prochaines étapes recommandées
1. Continuer le decoupage des tres gros ecrans restants, en priorite `src/features/appointments/ui/Appointments.jsx` et `src/features/appointments/ui/AddAppointment.jsx`
2. Ajouter des tests cibles sur les use cases critiques (`auth`, `appointments`, `notifications`, `profile`)
3. Introduire du code splitting sur les gros chunks Vite pour reduire le bundle principal

## Convention de nommage
- Dossiers: `kebab-case`
- Fichiers use-case: `<action><Entity>.js` ou `<entity>UseCases.js`
- Repository Firebase: `<entity>Repository.firebase.js`
- Pas de suffixe `_` dans routes/fichiers
- Éviter pluriels incohérents (`doctorServices` vs `doctorService`)
