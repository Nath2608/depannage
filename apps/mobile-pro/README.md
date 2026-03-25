# Depan Express - Application Professionnel

Application mobile React Native/Expo pour les professionnels (artisans plombiers et serruriers) de Depan Express.

## Fonctionnalités

### Authentification & Inscription
- Inscription avec validation SIRET
- Vérification d'identité (documents)
- Configuration du profil professionnel
- Gestion des spécialités et zones d'intervention

### Gestion de la Disponibilité
- Activation/désactivation en temps réel
- Planning hebdomadaire
- Gestion des congés et indisponibilités
- Mode "En intervention"

### Réception des Demandes
- Notifications push pour nouvelles demandes
- Filtrage par zone et type d'intervention
- Vue détaillée avec photos du problème
- Géolocalisation du client

### Création de Devis
- Modèles de devis personnalisables
- Calcul automatique avec catalogue de prix
- Ajout de photos
- Signature électronique
- Envoi direct au client

### Suivi des Missions
- Liste des missions acceptées
- Navigation GPS intégrée
- Mise à jour du statut en temps réel
- Communication avec le client

### Paiements & Facturation
- Réception des paiements
- Suivi des commissions
- Historique des revenus
- Export comptable

### Tableau de Bord
- Statistiques de performance
- Avis clients
- Classement et badges
- Objectifs mensuels

## Installation

### Prérequis

- Node.js 18+
- pnpm 8+
- Expo CLI
- iOS: Xcode 14+ (pour simulateur/build)
- Android: Android Studio (pour émulateur/build)

### Configuration

1. Installer les dépendances depuis la racine du monorepo:

```bash
pnpm install
```

2. Configurer les variables d'environnement:

```bash
cp .env.example .env
```

Variables requises:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_WS_URL=ws://localhost:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Lancement

```bash
# Développement
pnpm --filter @depan-express/mobile-pro dev

# Ou directement
cd apps/mobile-pro && npx expo start

# Avec tunnel (pour tests sur device physique)
npx expo start --tunnel
```

### Tests sur Device

**iOS Simulator:**
```bash
npx expo run:ios
```

**Android Emulator:**
```bash
npx expo run:android
```

## Structure du Projet

```
apps/mobile-pro/
├── app/                    # Routes (Expo Router)
│   ├── (auth)/            # Routes authentification
│   │   ├── login.tsx
│   │   ├── register/
│   │   │   ├── step1.tsx  # Infos personnelles
│   │   │   ├── step2.tsx  # Infos professionnelles
│   │   │   ├── step3.tsx  # Documents
│   │   │   └── step4.tsx  # Validation
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Routes principales
│   │   ├── index.tsx      # Tableau de bord
│   │   ├── requests.tsx   # Demandes reçues
│   │   ├── missions.tsx   # Missions en cours
│   │   ├── earnings.tsx   # Revenus
│   │   └── profile.tsx    # Profil
│   ├── request/           # Détail demande
│   │   ├── [id].tsx
│   │   └── quote.tsx      # Création devis
│   ├── mission/           # Gestion mission
│   │   ├── [id].tsx
│   │   ├── navigate.tsx
│   │   └── complete.tsx
│   └── _layout.tsx
├── src/
│   ├── components/        # Composants UI
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── mission/
│   │   └── quote/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   ├── useAvailability.ts
│   │   └── useNotifications.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── missions.ts
│   │   ├── quotes.ts
│   │   └── earnings.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── availabilityStore.ts
│   │   └── missionStore.ts
│   ├── types/
│   └── utils/
├── assets/
├── app.json
└── package.json
```

## Architecture

### Navigation
- **Expo Router** avec navigation par fichiers
- Tab navigation pour l'accès rapide aux sections principales
- Stack pour les flux de travail (devis, mission)

### État Global
- **Zustand** pour la gestion d'état
- **React Query** pour le cache API
- **MMKV** pour le stockage local persistant

### Temps Réel
- **Socket.io** pour les notifications instantanées
- Background location tracking pour le suivi GPS
- Background fetch pour la synchronisation

### Cartographie & Navigation
- **react-native-maps** pour l'affichage
- **expo-location** avec tracking en arrière-plan
- Intégration avec apps de navigation (Waze, Google Maps)

### Documents & Photos
- **expo-camera** pour les photos
- **expo-document-picker** pour les documents
- **expo-image-picker** pour la galerie
- Upload optimisé avec compression

## Spécificités Professionnel

### Mode Disponibilité
```tsx
// Composant de toggle disponibilité
function AvailabilityToggle() {
  const { isAvailable, setAvailable } = useAvailabilityStore();

  return (
    <Switch
      value={isAvailable}
      onValueChange={async (value) => {
        await updateAvailability(value);
        setAvailable(value);
      }}
    />
  );
}
```

### Tracking GPS en Arrière-Plan
```tsx
// Configuration du tracking
await Location.startLocationUpdatesAsync('background-location', {
  accuracy: Location.Accuracy.High,
  timeInterval: 5000, // 5 secondes
  distanceInterval: 10, // 10 mètres
  foregroundService: {
    notificationTitle: 'Depan Express',
    notificationBody: 'Suivi de position actif',
  },
});
```

### Création de Devis
Le système de devis permet:
- Sélection d'items prédéfinis depuis un catalogue
- Ajout d'items personnalisés
- Calcul automatique TVA
- Aperçu PDF
- Signature électronique

## Scripts Disponibles

```bash
# Développement
pnpm dev              # Démarrer Expo Dev Server

# Build
pnpm build:ios        # Build iOS (via EAS)
pnpm build:android    # Build Android (via EAS)
pnpm build:preview    # Build preview

# Tests
pnpm test             # Tests unitaires
pnpm test:e2e         # Tests E2E (Detox)

# Qualité
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
```

## Builds & Déploiement

### Configuration EAS

```bash
# Login
eas login

# Configuration
eas build:configure
```

### Profils de Build

**eas.json:**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build & Submit
```bash
# Build production
eas build --profile production --platform all

# Submit aux stores
eas submit --platform ios
eas submit --platform android
```

## Tests

### Tests Unitaires
```bash
pnpm test
pnpm test:coverage
```

### Tests E2E
```bash
# Build app de test
detox build -c ios.sim.debug

# Exécuter les tests
detox test -c ios.sim.debug
```

## Permissions Requises

### iOS (Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Pour vous localiser et vous guider vers les clients</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Pour permettre aux clients de suivre votre arrivée</string>

<key>NSCameraUsageDescription</key>
<string>Pour prendre des photos des interventions</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Pour sélectionner des photos pour les devis</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>fetch</string>
  <string>remote-notification</string>
</array>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

## Design System

### Couleurs Pro
```ts
export const colors = {
  primary: '#1E3A5F',      // Bleu marine (Pro)
  accent: '#FF6B35',       // Orange Depan Express
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  available: '#22C55E',    // Vert disponible
  busy: '#F59E0B',         // Orange en intervention
  offline: '#9CA3AF',      // Gris hors ligne
};
```

### États Visuels
- **Disponible**: Badge vert, icône active
- **En intervention**: Badge orange, timer actif
- **Indisponible**: Badge gris, fonctions limitées

## Notifications

### Types de Notifications
1. **Nouvelle demande** - Son urgent, vibration
2. **Devis accepté** - Notification standard
3. **Rappel mission** - Notification planifiée
4. **Paiement reçu** - Notification avec montant
5. **Nouvel avis** - Notification informative

### Configuration
```tsx
// Canaux de notification Android
Notifications.setNotificationChannelAsync('urgent', {
  name: 'Demandes urgentes',
  importance: Notifications.AndroidImportance.MAX,
  sound: 'urgent.wav',
  vibrationPattern: [0, 250, 250, 250],
});

Notifications.setNotificationChannelAsync('default', {
  name: 'Notifications générales',
  importance: Notifications.AndroidImportance.DEFAULT,
});
```

## Debugging

### Flipper
- Network inspector pour debug API
- Layout inspector
- Database viewer (MMKV)

### Logs
```bash
# Voir les logs en temps réel
npx react-native log-ios
npx react-native log-android
```

### Sentry
Intégration automatique pour:
- Crash reporting
- Performance monitoring
- User feedback

## Contribution

1. Créer une branche: `git checkout -b feature/ma-feature`
2. Conventional commits: `git commit -m "feat(mobile-pro): description"`
3. Push et PR

## Support

- Documentation API: http://localhost:3000/api/docs
- Support technique: support-pro@depan-express.fr
- Hotline Pro: 01 XX XX XX XX
