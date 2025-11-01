# Auth Better Auth — Mode Bearer-only (Expo / RN friendly)

## Vue d'ensemble

Ce projet utilise Better Auth pour l'authentification, intégré dans une application NestJS avec un adapter TypeORM custom.
Nous standardisons l’auth sur un unique mode: Bearer-only, en utilisant le « session token » Better Auth dans le header Authorization.

## Architecture

### Approche choisie

Nous utilisons l'API programmatique de Better Auth (auth.api.\*) et nous ne manipulons plus de cookies. Le client reçoit un `sessionToken` et l’envoie dans `Authorization: Bearer <sessionToken>` pour chaque requête. C’est idéal pour Expo/React Native et évite les soucis de cookies httpOnly sur mobile.

## Notre implémentation

### Pourquoi Bearer-only ?

- Expo / RN: gestion des cookies httpOnly compliquée; Bearer est simple et fiable
- Swagger natif: tests faciles via l’auth Bearer
- Cohérence: une seule méthode → moins d’ambiguïtés et de failles

### Code clé

#### 1. CORS (`src/main.ts`)

```typescript
app.enableCors({
  origin: configService.get('app.corsOrigin') || 'http://localhost:3000',
  credentials: true, // optionnel en mode Bearer
});
```

#### 2. Pas de cookies

Nous ne posons plus de cookies httpOnly; le token de session est uniquement renvoyé dans la réponse JSON à l’auth et transmis par le client en Bearer.

#### 3. Récupération de session (`src/auth/better-auth.service.ts`)

`getSession()` exige le header Authorization et reconstruit un cookie interne pour l’API Better Auth:

```typescript
async getSession(headers: Record<string, unknown>) {
  const token = (headers.authorization as string | undefined)?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return this.auth.api.getSession({ headers: { cookie: `better-auth.session_token=${token}` } as any });
}
```

## Flux d'authentification

### 1. Register / Login

1. Client envoie les credentials à `/api/v1/auth/register` ou `/api/v1/auth/login`
2. `AuthController` appelle `AuthService.register()` ou `AuthService.login()`
3. `AuthService` utilise l'API programmatique de Better Auth (`auth.api.signUpEmail()`)
4. Better Auth retourne un token de session
5. L’API renvoie `{ sessionToken, expiresIn, user }`

### 2. Requêtes authentifiées

1. Client envoie le header `Authorization: Bearer <sessionToken>`
2. `AuthGuard` intercepte la requête
3. `AuthGuard` appelle `BetterAuthService.getSession()` avec les headers
4. `BetterAuthService.getSession()` utilise Authorization pour valider la session
5. Better Auth valide la session
6. La requête continue si la session est valide

### 3. Logout

1. Client envoie une requête à `/api/v1/auth/logout`
2. `AuthController` appelle `AuthService.logout()`
3. `AuthService` invalide la session via Better Auth
4. Rien côté cookies (mode Bearer-only)

## Notes sécurité et prod

- En production, `requireEmailVerification` est activé.
- Stockez `AUTH_SECRET` dans les variables d’environnement.
- Le token est opaque: gardez une durée raisonnable (7 jours par défaut) et invalidez côté logout.

## Références

- [Better Auth Documentation](https://www.better-auth.com/)
- [@thallesp/nestjs-better-auth GitHub](https://github.com/ThallesP/nestjs-better-auth)
- [Better Auth HTTP Handlers](https://www.better-auth.com/docs/concepts/http-handlers)
  (non utilisés ici — nous sommes en mode programmatique + Bearer)

  ## Exemples d'appels (Expo / React Native)

  ### Login

  ```ts
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { sessionToken, user } = await res.json();
  // Stocker sessionToken dans SecureStore/Keychain
  ```

  ### Requête authentifiée

  ```ts
  const res = await fetch(`${API_URL}/api/v1/auth/profile`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  const profile = await res.json();
  ```

  ### Logout

  ```ts
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  ```
