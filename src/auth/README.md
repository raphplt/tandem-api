# Authentication Module

Ce module fournit une authentification robuste et sécurisée utilisant les outils natifs de NestJS.

## Fonctionnalités

- ✅ Inscription d'utilisateurs avec validation
- ✅ Connexion avec email/mot de passe
- ✅ JWT Access Token (15 minutes)
- ✅ JWT Refresh Token (7 jours)
- ✅ Gestion des rôles
- ✅ Changement de mot de passe
- ✅ Déconnexion
- ✅ Validation des utilisateurs actifs
- ✅ Hachage sécurisé des mots de passe (bcryptjs avec 12 rounds)

## Endpoints

### POST /auth/register

Inscription d'un nouvel utilisateur

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01"
}
```

### POST /auth/login

Connexion d'un utilisateur

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/refresh

Rafraîchissement du token d'accès

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/logout

Déconnexion (nécessite un token valide)

### GET /auth/profile

Récupération du profil utilisateur (nécessite un token valide)

### POST /auth/change-password

Changement de mot de passe (nécessite un token valide)

```json
{
  "oldPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

## Configuration

Variables d'environnement requises :

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=tandem-api
JWT_AUDIENCE=tandem-app
```

## Sécurité

- Mots de passe hachés avec bcryptjs (12 rounds)
- Tokens JWT signés avec HMAC SHA-256
- Validation stricte des entrées
- Protection contre les utilisateurs inactifs
- Refresh token rotation (à implémenter si nécessaire)

## Utilisation des Guards

```typescript
// Protection d'une route
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@CurrentUser() user: any) {
  return user;
}

// Protection avec rôles
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin-only')
async adminOnlyRoute() {
  return 'Admin only content';
}
```
