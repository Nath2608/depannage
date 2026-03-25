# Depan Express - Application Client

Application mobile React Native/Expo pour les clients de Depan Express - Dépannage plomberie et serrurerie à domicile.

## Fonctionnalités

### Authentification
- Inscription avec email/téléphone
- Connexion avec 2FA optionnel
- Réinitialisation de mot de passe
- Session persistante avec refresh token

### Demande de Service
- Sélection du type d'urgence (plomberie/serrurerie)
- Description du problème avec photos
- Géolocalisation automatique ou saisie manuelle de l'adresse
- Disponibilité immédiate ou planifiée

### Gestion des Devis
- Réception de devis multiples
- Comparaison des professionnels (avis, tarifs, délais)
- Acceptation/refus de devis
- Historique des devis

### Suivi de Mission
- Suivi GPS en temps réel du professionnel
- Estimation du temps d'arrivée
- Communication directe via chat/appel
- Notifications push à chaque étape

### Paiement
- Paiement sécurisé via Stripe
- Historique des factures
- Gestion des moyens de paiement

### Avis et Évaluations
- Noter les professionnels (1-5 étoiles)
- Laisser des commentaires
- Consulter l'historique des interventions

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
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Lancement

```bash
# Développement
pnpm --filter @depan-express/mobile-customer dev

# Ou directement
cd apps/mobile-customer && npx expo start

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

**Device Physique:**
1. Installer Expo Go depuis l'App Store / Play Store
2. Scanner le QR code affiché dans le terminal

## Structure du Projet

```
apps/mobile-customer/
├── app/                    # Routes (Expo Router)
│   ├── (auth)/            # Routes authentification
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/            # Routes principales avec navigation
│   │   ├── index.tsx      # Accueil
│   │   ├── requests.tsx   # Mes demandes
│   │   ├── history.tsx    # Historique
│   │   └── profile.tsx    # Profil
│   ├── request/           # Création de demande
│   │   ├── new.tsx
│   │   ├── photos.tsx
│   │   └── confirm.tsx
│   ├── job/               # Suivi de mission
│   │   ├── [id].tsx
│   │   └── tracking.tsx
│   └── _layout.tsx
├── src/
│   ├── components/        # Composants UI
│   │   ├── common/        # Boutons, inputs, etc.
│   │   ├── request/       # Composants demande
│   │   ├── job/           # Composants mission
│   │   └── maps/          # Composants carte
│   ├── hooks/             # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   └── useNotifications.ts
│   ├── services/          # API calls
│   │   ├── api.ts         # Configuration Axios
│   │   ├── auth.ts
│   │   ├── requests.ts
│   │   └── jobs.ts
│   ├── stores/            # État global (Zustand)
│   │   ├── authStore.ts
│   │   └── requestStore.ts
│   ├── types/             # TypeScript types
│   └── utils/             # Utilitaires
├── assets/                # Images, fonts
├── app.json              # Configuration Expo
└── package.json
```

## Architecture

### Navigation
- **Expo Router** pour la navigation basée sur le système de fichiers
- Layout avec onglets pour la navigation principale
- Stack navigation pour les flux (création demande, suivi mission)

### État Global
- **Zustand** pour la gestion d'état simple et performante
- **React Query** pour le cache des données serveur
- **MMKV** pour le stockage local rapide

### API & Temps Réel
- **Axios** avec intercepteurs pour l'authentification
- **Socket.io** pour les mises à jour en temps réel
- Refresh automatique des tokens

### Cartographie
- **react-native-maps** pour l'affichage des cartes
- **expo-location** pour la géolocalisation
- Tracking en temps réel des professionnels

### Paiements
- **Stripe React Native SDK** pour les paiements sécurisés
- Support Apple Pay / Google Pay
- Enregistrement de cartes

### Notifications
- **expo-notifications** pour les push notifications
- Notifications locales pour les rappels
- Deep linking vers les écrans pertinents

## Scripts Disponibles

```bash
# Développement
pnpm dev              # Démarrer Expo Dev Server

# Build
pnpm build:ios        # Build iOS (via EAS)
pnpm build:android    # Build Android (via EAS)
pnpm build:preview    # Build preview (internal testing)

# Tests
pnpm test             # Tests unitaires
pnpm test:e2e         # Tests E2E (Detox)

# Qualité du code
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
```

## Builds & Déploiement

### Configuration EAS

```bash
# Installation
npm install -g eas-cli

# Login
eas login

# Configuration (première fois)
eas build:configure
```

### Build Development
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Build Preview (TestFlight / Internal Testing)
```bash
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Build Production
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Soumission aux stores
```bash
# App Store
eas submit --platform ios

# Play Store
eas submit --platform android
```

## Tests

### Tests Unitaires (Jest)
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Tests E2E (Detox)
```bash
# iOS
detox build -c ios.sim.debug
detox test -c ios.sim.debug

# Android
detox build -c android.emu.debug
detox test -c android.emu.debug
```

## Conventions de Code

### Composants
- Composants fonctionnels avec TypeScript
- Props typées avec interfaces
- Styles avec StyleSheet.create()

### Nommage
- Components: PascalCase
- Hooks: camelCase avec prefix `use`
- Services: camelCase
- Types: PascalCase avec suffix approprié (Props, State, etc.)

### Exemple de Composant
```tsx
import { View, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable
      style={[styles.button, styles[variant]]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: '#FF6B35',
  },
  secondary: {
    backgroundColor: '#E5E5E5',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
```

## Design System

### Couleurs
```ts
export const colors = {
  primary: '#FF6B35',      // Orange Depan Express
  secondary: '#1E3A5F',    // Bleu marine
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8F9FA',
  text: '#1F2937',
  textSecondary: '#6B7280',
};
```

### Typographie
- Font principale: Inter (via expo-font)
- Tailles: 12, 14, 16, 18, 20, 24, 32

### Espacements
- Base unit: 4px
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48

## Debugging

### React Native Debugger
```bash
# Installation
brew install react-native-debugger

# Lancement
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Flipper
Support intégré pour:
- Network inspector
- Layout inspector
- Database viewer
- Logs

### Logs Console
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

## Contribution

1. Créer une branche feature: `git checkout -b feature/ma-feature`
2. Commiter avec conventional commits: `git commit -m "feat: ajout nouvelle fonctionnalité"`
3. Push et créer une PR

## Support

- Documentation API: http://localhost:3000/api/docs
- Issues: GitHub Issues
- Contact: support@depan-express.fr
