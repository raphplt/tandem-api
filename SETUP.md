# 🚀 Guide de Démarrage Tandem API

## 📋 Prérequis

- Node.js 22+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## ⚡ Démarrage Rapide

### 1. Configuration

```bash
# Copier le fichier d'environnement
cp env.example .env

# Éditer les variables selon votre environnement
# DATABASE_HOST, REDIS_HOST, KEYCLOAK_URL, etc.
```

### 2. Services Externes

```bash
# Démarrer PostgreSQL, Redis, Keycloak
docker-compose up -d postgres redis keycloak

# Attendre que les services soient prêts (30s)
```

### 3. Installation & Lancement

```bash
# Installer les dépendances
npm install

# Démarrer en développement
npm run start:dev
```

### 4. Vérification

- **API** : http://localhost:3000/api/v1
- **Documentation** : http://localhost:3000/api/docs
- **Keycloak Admin** : http://localhost:8080 (admin/admin)

## 🏗️ Architecture NestJS

Le projet suit l'architecture standard NestJS avec des ressources complètes :

### **Modules Principaux**

- `users` - Gestion des utilisateurs
- `profiles` - Profils utilisateurs
- `availability` - Disponibilité quotidienne
- `matches` - Appariements
- `conversations` - Conversations 24h
- `messages` - Messages
- `rewards` - Système de récompenses
- `reports` - Signalements
- `push-tokens` - Tokens de notification
- `interests` - Intérêts utilisateurs
- `values` - Valeurs utilisateurs
- `notifications` - Notifications
- `admin` - Administration
- `analytics` - Analytics

### **Structure par Module**

```
src/
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       └── user.entity.ts
```

## 🔧 Configuration

### **Variables d'Environnement**

- `DATABASE_*` - Configuration PostgreSQL
- `REDIS_*` - Configuration Redis
- `KEYCLOAK_*` - Configuration Keycloak OIDC
- `JWT_*` - Configuration JWT
- `SENTRY_DSN` - Monitoring des erreurs
- `FIREBASE_*` - Notifications push
- `RESEND_API_KEY` - Emails transactionnels

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Tests de charge (k6)
k6 run tests/load/conversation-load.js
```

## 🚀 Production

```bash
# Build
npm run build

# Docker
docker build -t tandem-api .
docker run -p 3000:3000 tandem-api
```

## 📝 Prochaines Étapes

1. **Configurer Keycloak** avec votre realm
2. **Implémenter la logique métier** dans les services
3. **Ajouter WebSocket** pour les conversations temps réel
4. **Configurer Firebase** pour les notifications push
5. **Implémenter les tests** e2e complets

---

_Architecture complète disponible dans `agent.md`_
