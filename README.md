# HealthSync - Application de Gestion Médicale

## 🏥 Description

HealthSync est une application web moderne de gestion médicale qui permet aux médecins et patients de gérer leurs données de santé de manière sécurisée et efficace.

## ✨ Fonctionnalités

### Pour les Médecins
- 👨‍⚕️ Gestion des profils patients
- 💊 Création et gestion d'ordonnances
- 📅 Planification des rendez-vous
- 💬 Communication sécurisée avec les patients
- 📊 Suivi des symptômes des patients

### Pour les Patients
- 👤 Gestion du profil personnel
- 💊 Suivi des médicaments et rappels
- 📝 Enregistrement des symptômes
- 📅 Demande de rendez-vous
- 💬 Communication avec les médecins

## 🛠 Technologies Utilisées

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Tests**: Jest, React Testing Library
- **Notifications**: Firebase Cloud Messaging
- **Sécurité**: Chiffrement des données sensibles
- **Accessibilité**: WCAG 2.1 AA

## 🚀 Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/healthsync.git
cd healthsync
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
```
Remplissez les variables d'environnement dans le fichier `.env`

4. **Démarrer l'application**
```bash
npm run dev
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests pour CI/CD
npm run test:ci
```

## 🔒 Sécurité

- ✅ Validation des données côté client et serveur
- ✅ Chiffrement des données médicales sensibles
- ✅ Authentification sécurisée avec Firebase Auth
- ✅ Gestion des erreurs centralisée
- ✅ Protection contre les injections XSS
- ✅ Conformité RGPD

## ♿ Accessibilité

- ✅ Navigation au clavier
- ✅ Support des lecteurs d'écran
- ✅ Contrastes de couleurs conformes WCAG
- ✅ Attributs ARIA appropriés
- ✅ Focus management

## 📱 Responsive Design

L'application est entièrement responsive et optimisée pour :
- 📱 Mobile (320px+)
- 📱 Tablette (768px+)
- 💻 Desktop (1024px+)

## 🔧 Scripts Disponibles

```bash
npm run dev          # Démarrage en développement
npm run build        # Build de production
npm run preview      # Prévisualisation du build
npm run lint         # Linting du code
npm test             # Tests unitaires
npm run test:coverage # Tests avec couverture
```

## 📊 Métriques de Qualité

- **Couverture de tests**: > 80%
- **Performance**: Score Lighthouse > 90
- **Accessibilité**: WCAG 2.1 AA
- **Sécurité**: Aucune vulnérabilité critique

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **Développeur Principal**: [Votre Nom]
- **UI/UX Designer**: [Nom du Designer]
- **Product Owner**: [Nom du PO]

## 📞 Support

Pour toute question ou problème :
- 📧 Email: support@healthsync.com
- 🐛 Issues: [GitHub Issues](https://github.com/votre-username/healthsync/issues)
- 📖 Documentation: [Wiki](https://github.com/votre-username/healthsync/wiki)