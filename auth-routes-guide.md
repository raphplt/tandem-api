# Guide des Routes d'Authentification - Tandem API

Ce document répertorie toutes les routes d'authentification disponibles dans l'API Tandem avec leurs méthodes HTTP, endpoints, corps de requête et réponses attendues.

## Base URL
```
http://localhost:3001/api/v1
```

## Routes d'Authentification

### 1. Inscription d'un utilisateur

**Endpoint:** `POST /auth/register`

**Description:** Crée un nouveau compte utilisateur

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

**Validation:**
- `email`: Email valide (requis)
- `password`: Minimum 6 caractères (requis)
- `firstName`: 2-50 caractères (requis)
- `lastName`: 2-50 caractères (requis)
- `dateOfBirth`: Date valide au format ISO (optionnel)

**Réponse de succès (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"]
  }
}
```

**Réponses d'erreur:**
- `400`: Données invalides ou inscription échouée
- `409`: Utilisateur avec cet email existe déjà

---

### 2. Connexion d'un utilisateur

**Endpoint:** `POST /auth/login`

**Description:** Authentifie un utilisateur existant

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: Email valide (requis)
- `password`: Minimum 6 caractères (requis)

**Réponse de succès (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"]
  }
}
```

**Réponses d'erreur:**
- `401`: Identifiants invalides
- `400`: Connexion échouée

---

### 3. Déconnexion d'un utilisateur

**Endpoint:** `POST /auth/logout`

**Description:** Déconnecte l'utilisateur actuellement connecté

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:** Aucun

**Réponse de succès (200):**
```json
{
  "message": "Successfully logged out"
}
```

**Réponses d'erreur:**
- `401`: Non autorisé
- `500`: Erreur de déconnexion

---

### 4. Profil utilisateur

**Endpoint:** `GET /auth/profile`

**Description:** Récupère le profil de l'utilisateur connecté

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:** Aucun

**Réponse de succès (200):**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["user"]
}
```

**Réponses d'erreur:**
- `401`: Non autorisé

---

### 5. Changement de mot de passe

**Endpoint:** `POST /auth/change-password`

**Description:** Change le mot de passe de l'utilisateur connecté

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "oldPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Validation:**
- `oldPassword`: Mot de passe actuel (requis)
- `newPassword`: Nouveau mot de passe (requis)

**Réponse de succès (200):**
```json
{
  "message": "Password successfully changed"
}
```

**Réponses d'erreur:**
- `401`: Non autorisé ou ancien mot de passe invalide
- `400`: Nouveau mot de passe invalide ou changement échoué

---

## Exemples d'utilisation avec cURL

### Inscription
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Profil (avec token)
```bash
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Déconnexion
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Changement de mot de passe
```bash
curl -X POST http://localhost:3001/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "password123",
    "newPassword": "newpassword123"
  }'
```

---

## Notes importantes

1. **Authentification:** Toutes les routes sauf `/register` et `/login` nécessitent un token d'authentification dans le header `Authorization: Bearer <token>`

2. **Durée des tokens:** Les tokens expirent après 7 jours (604800 secondes)

3. **Validation:** Toutes les données sont validées côté serveur avec des règles strictes

4. **Sécurité:** Les mots de passe sont hashés automatiquement par Better Auth

5. **Base de données:** Les utilisateurs sont créés dans les tables Better Auth et synchronisés avec la table User principale

6. **CORS:** L'API accepte les requêtes depuis `http://localhost:3001` par défaut

---

## Codes de statut HTTP

- `200`: Succès
- `201`: Créé avec succès
- `400`: Requête invalide
- `401`: Non autorisé
- `409`: Conflit (ressource existe déjà)
- `500`: Erreur serveur interne
