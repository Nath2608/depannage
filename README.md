# 🔧 Depan Express

**Plateforme de dépannage à domicile - Plomberie & Serrurerie**

Une solution complète de type "Uber" pour les services de dépannage d'urgence, connectant les clients aux professionnels qualifiés en temps réel.

[![CI](https://github.com/depan-express/depan-express/actions/workflows/ci.yml/badge.svg)](https://github.com/depan-express/depan-express/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

## 📱 Applications

| Application | Description | Technologies |
|-------------|-------------|--------------|
| **API Backend** | REST API + WebSocket | NestJS, Prisma, PostgreSQL |
| **Admin Dashboard** | Back-office administration | Next.js 14, React Query |
| **App Client** | Application mobile client | React Native, Expo |
| **App Professionnel** | Application mobile pro | React Native, Expo |

## 🏗️ Architecture

```
depan-express/
├── apps/
│   ├── api/                 # Backend NestJS
│   ├── admin/               # Admin Next.js
│   ├── mobile-customer/     # App client React Native
│   └── mobile-pro/          # App pro React Native
├── packages/
│   ├── shared/              # Types & utilitaires partagés
│   ├── eslint-config/       # Configuration ESLint
│   └── tsconfig/            # Configuration TypeScript
├── nginx/                   # Configuration Nginx
├── scripts/                 # Scripts utilitaires
└── .github/workflows/       # CI/CD GitHub Actions
```

## 🛠️ Stack Technique

### Backend
- **Framework**: NestJS 10
- **ORM**: Prisma
- **Base de données**: PostgreSQL 16
- **Cache/Sessions**: Redis 7
- **WebSocket**: Socket.IO
- **Authentification**: JWT (access + refresh tokens)
- **Validation**: class-validator, class-transformer
- **Documentation API**: Swagger/OpenAPI

### Frontend Web (Admin)
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Charts**: Recharts
- **Tables**: TanStack Table

### Mobile
- **Framework**: React Native + Expo SDK 51
- **Navigation**: Expo Router (file-based)
- **State**: Zustand
- **Maps**: react-native-maps
- **Caméra**: expo-camera, expo-image-picker

### Services Tiers
- **Paiements**: Stripe
- **SMS**: Twilio
- **Email**: SendGrid
- **Push Notifications**: Firebase Cloud Messaging
- **Cartographie**: Google Maps API
- **Stockage**: AWS S3 / MinIO

## 🚀 Démarrage Rapide

### Prérequis

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### Installation

```bash
# Cloner le repository
git clone https://github.com/depan-express/depan-express.git
cd depan-express

# Installation automatique
make setup

# OU installation manuelle:
pnpm install
cp .env.example .env
docker compose --profile dev up -d
pnpm db:generate
pnpm db:migrate
```

### Développement

```bash
# Démarrer tous les services
pnpm dev

# Démarrer uniquement l'API
pnpm --filter api dev

# Démarrer uniquement l'admin
pnpm --filter admin dev

# Ouvrir Prisma Studio
pnpm db:studio
```

### Commandes Disponibles

```bash
# Development
make dev              # Démarrer en mode dev
make docker-up-dev    # Démarrer Docker avec outils dev

# Testing
make test             # Tous les tests
make test-api         # Tests API uniquement
make lint             # Linting
make typecheck        # Vérification types

# Database
make migrate          # Appliquer migrations
make seed             # Seeder la BDD
make backup           # Sauvegarder la BDD
make db-studio        # Ouvrir Prisma Studio

# Docker
make docker-up        # Démarrer services
make docker-down      # Arrêter services
make docker-logs      # Voir les logs
make docker-build     # Rebuild images

# Production
make deploy-staging   # Déployer en staging
make deploy-production # Déployer en prod
```

## 📚 Documentation API

La documentation Swagger est disponible sur:
- **Développement**: http://localhost:3000/api/docs
- **Production**: https://api.depanexpress.fr/api/docs

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests avec couverture
pnpm test:cov

# Tests E2E
pnpm test:e2e

# Tests en mode watch
pnpm --filter api test:watch
```

## 🔐 Comptes de Test

Après avoir exécuté `pnpm db:seed`:

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | admin@depan-express.fr | Admin123! |
| Support | support@depan-express.fr | Support123! |
| Client | jean.dupont@email.com | Customer123! |
| Client | marie.martin@email.com | Customer123! |
| Plombier | paul.plombier@artisan.fr | Pro123! |
| Serrurier | sarah.serrurier@artisan.fr | Pro123! |

## 🐳 Services Docker

### Développement

```bash
docker compose --profile dev up -d
```

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Base de données |
| Redis | 6379 | Cache & sessions |
| MinIO | 9000/9001 | Stockage S3 local |
| MailHog | 1025/8025 | Email testing |
| Adminer | 8080 | Admin BDD |
| API | 3000 | Backend NestJS |
| Admin | 3001 | Dashboard Next.js |

### Production

```bash
docker compose --profile prod up -d
```

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Base de données |
| Redis | 6379 | Cache & sessions |
| API | 3000 | Backend NestJS |
| Admin | 3001 | Dashboard Next.js |
| Nginx | 80/443 | Reverse proxy + SSL |

## 📦 Déploiement

### CI/CD Pipeline

Le pipeline GitHub Actions effectue:
1. **Lint & Type Check** - Vérification du code
2. **Tests** - Tests unitaires et E2E
3. **Build** - Construction des images Docker
4. **Deploy Staging** - Déploiement auto sur branche `develop`
5. **Deploy Production** - Déploiement auto sur branche `main`

### Variables d'Environnement

Voir `.env.example` pour la liste complète des variables nécessaires.

**Secrets GitHub requis:**
- `DOCKER_USERNAME` / `DOCKER_PASSWORD`
- `STAGING_HOST` / `STAGING_USER` / `STAGING_SSH_KEY`
- `PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY`
- `NEXT_PUBLIC_API_URL`

## 📊 Monitoring

- **Logs**: Disponibles via `docker compose logs -f`
- **Sentry**: Intégré pour le tracking d'erreurs
- **Health Checks**: Disponibles sur `/api/v1/health`

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- Rate limiting sur les endpoints sensibles
- Validation des données entrantes
- Headers de sécurité (HSTS, CSP, etc.)
- Chiffrement des mots de passe (Argon2)
- Protection CORS configurée

## 📄 License

Proprietary - All rights reserved

---

**Depan Express** - Dépannage rapide, service de qualité 🔧
