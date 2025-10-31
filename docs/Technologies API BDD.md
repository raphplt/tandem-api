# Vue d'ensemble technique - Tandem API

## Stack technique

### Framework principal
- **NestJS** (v11) - Framework Node.js basé sur TypeScript
- **TypeScript** (v5.7) - Langage de programmation
- **Express** - Serveur HTTP sous-jacent (via @nestjs/platform-express)

### Base de données
- **PostgreSQL** (v15) - Base de données relationnelle principale
- **TypeORM** (v0.3.27) - ORM pour la gestion des entités et migrations

### Cache et queues
- **Redis** (v7) - Cache et broker de messages
- **BullMQ** (v5) - Système de queues pour les tâches asynchrones
- **@nestjs/bull** - Intégration BullMQ avec NestJS
- **cache-manager-redis-store** - Cache Redis pour NestJS

### WebSockets
- **Socket.IO** (v4.8) - Communication temps réel
- **@socket.io/redis-adapter** - Adapter Redis pour la scalabilité horizontale des WebSockets

### Authentification
- **better-auth** (v1.3) - Bibliothèque d'authentification moderne
- **@thallesp/nestjs-better-auth** - Adapter NestJS pour better-auth
- **bcryptjs** - Hachage des mots de passe

### Observabilité et monitoring
- **Sentry** (@sentry/nestjs v10) - Suivi des erreurs et performance
- **OpenTelemetry** - Instrumentation et tracing distribué
  - `@opentelemetry/auto-instrumentations-node`
  - `@opentelemetry/exporter-otlp-http`
  - `@opentelemetry/exporter-prometheus`
- **Jaeger** - Visualisation des traces (via docker-compose)
- **Winston** - Logging
- **Morgan** - Logging HTTP

### Services externes
- **Firebase Admin** (v13) - Notifications push
- **Resend** (v6) - Service d'envoi d'emails

### Sécurité
- **Helmet** - Sécurisation des en-têtes HTTP
- **CORS** - Gestion Cross-Origin
- **@nestjs/throttler** - Limitation de débit (rate limiting)
- **compression** - Compression des réponses HTTP

### Documentation
- **Swagger/OpenAPI** (@nestjs/swagger v11) - Documentation interactive disponible sur `/api/docs`

### Utilitaires
- **class-validator** - Validation des DTOs
- **class-transformer** - Transformation des objets
- **@nestjs/schedule** - Tâches planifiées (cron jobs)
- **@nestjs/event-emitter** - Émission d'événements internes

## Architecture

### Structure modulaire
L'API est organisée en modules NestJS :

- **Auth** - Authentification et autorisation
- **Users** - Gestion des utilisateurs
- **Profiles** - Profils utilisateurs
- **Matches** - Système de matching
- **Conversations** - Conversations entre utilisateurs
- **Messages** - Messages avec WebSocket en temps réel
- **Notifications** - Notifications push
- **Availability** - Disponibilités des utilisateurs
- **Interests** - Centres d'intérêt
- **Values** - Valeurs des utilisateurs
- **Rewards** - Système de récompenses
- **Reports** - Signalements
- **Push Tokens** - Gestion des tokens push
- **Admin** - Administration
- **Analytics** - Analytics et métriques

### Configuration
- Configuration centralisée via `@nestjs/config`
- Fichiers de configuration : `app.config.ts`, `database.config.ts`, `redis.config.ts`
- Variables d'environnement pour la configuration

### Middleware et guards
- **ValidationPipe** - Validation globale des DTOs
- **GlobalExceptionFilter** - Gestion centralisée des erreurs
- **LoggingInterceptor** - Logging des requêtes
- **TracingMiddleware** - Traçage des requêtes
- **AuthGuard** - Protection des routes
- **RolesGuard** - Gestion des rôles
- **OwnershipGuard** - Vérification de propriété

## Infrastructure

### Docker
Services définis dans `docker-compose.yml` :
- **PostgreSQL** (port 5435)
- **Redis** (port 6379)
- **Jaeger** (ports 16686, 14268)

### Ports
- API principale : 3001 (configurable)
- API Documentation : `/api/docs`
- Préfixe API : `/api/v1`

## Build et déploiement

### Scripts disponibles
- `npm run build` - Compilation TypeScript
- `npm run start:dev` - Mode développement avec watch
- `npm run start:prod` - Mode production
- `npm run lint` - Linting avec ESLint
- `npm run test` - Tests unitaires (Jest)
- `npm run test:e2e` - Tests end-to-end

### Compilateur
- **SWC** - Compilateur rapide pour TypeScript (utilisé par NestJS)

## Environnement
- **Node.js** - Runtime (version recommandée non spécifiée, compatible avec les dépendances)
- **TypeScript** - Compilation vers ES2023

