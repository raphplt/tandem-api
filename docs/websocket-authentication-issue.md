# 🔴 Problème d'authentification WebSocket - Chat en temps réel

## 📋 Résumé du problème

Le client Socket.IO (React Native/Expo) se connecte avec succès au serveur WebSocket (`/chat` namespace), mais le serveur **déconnecte immédiatement** le client après la connexion. Cela empêche l'envoi de messages qui timeout après 5 secondes.

## 🔍 Diagnostic

### Symptômes observés

```
✅ Socket connected! ID: bGlSY0Wh8H45LEf_AAA3
Transport used: websocket
❌ Socket disconnected. Reason: io server disconnect
ERROR Server forcefully disconnected the socket. Possible authentication issue.
```

**Séquence des événements :**
1. ✅ Le client établit la connexion WebSocket
2. ✅ Le serveur accepte la connexion et attribue un ID
3. ❌ Le serveur déconnecte immédiatement avec raison `"io server disconnect"`
4. ❌ Toute tentative d'envoi de message échoue avec `"operation has timed out"`

### Cause probable

Le **`WsAuthGuard`** côté backend rejette l'authentification et force la déconnexion. Le token est envoyé mais probablement pas lu correctement par le guard.

## 🔧 Implémentation actuelle (Frontend)

### Configuration de la connexion Socket.IO

```typescript
// src/providers/chat-socket-provider.tsx

const socket = io(`${env.baseURL}/chat`, {
  transports: ["websocket", "polling"],
  autoConnect: false,
  auth: {
    token: token,  // Méthode Socket.IO v3+ recommandée
  },
  query: {
    token: token,  // Token dans l'URL de connexion
  },
  extraHeaders: {
    Authorization: `Bearer ${token}`,  // Header HTTP classique
  },
});
```

**Nous envoyons le token de 3 façons différentes :**
1. Dans `auth.token` (recommandé Socket.IO v3+)
2. Dans `query.token` (accessible via handshake.query)
3. Dans `extraHeaders.Authorization` (accessible via handshake.headers)

### Token utilisé

- **Source :** `session.sessionToken` de Better Auth
- **Format :** String de ~20+ caractères (ex: `Xl6lYHnNGCyIK5HX3DS8...`)
- **Validité :** Le token fonctionne pour les requêtes HTTP REST

### Logs détaillés de connexion

```
[ChatSocketProvider] Token present: true
[ChatSocketProvider] Token preview: Xl6lYHnNGCyIK5HX3DS8...
[ChatSocketProvider] ✅ Socket connected! ID: bGlSY0Wh8H45LEf_AAA3
[ChatSocketProvider] Transport used: websocket
[ChatSocketProvider] ❌ Socket disconnected. Reason: io server disconnect
```

## 🔍 Points à vérifier côté Backend

### 1. Configuration du WsAuthGuard

**Question :** Comment le `WsAuthGuard` lit-il le token dans le handshake ?

Options possibles :
- `socket.handshake.auth.token` → Socket.IO v3+ standard
- `socket.handshake.query.token` → Query parameter
- `socket.handshake.headers.authorization` → Header HTTP
- Cookies dans `socket.handshake.headers.cookie`

**Action requise :** Vérifier quelle propriété est lue et s'assurer qu'elle correspond à ce que nous envoyons.

### 2. Format du token attendu

**Question :** Le backend attend-il :
- Le token brut : `Xl6lYHnNGCyIK5HX3DS8...`
- Avec préfixe Bearer : `Bearer Xl6lYHnNGCyIK5HX3DS8...`
- Un format JWT différent ?

**Action requise :** Vérifier le parsing du token dans le guard.

### 3. Validation du token

**Question :** Pourquoi le token est-il rejeté ?
- Le token n'est pas trouvé dans le handshake ?
- Le token est invalide/expiré ?
- La vérification Better Auth échoue ?
- Un middleware force la déconnexion ?

**Action requise :** Ajouter des logs dans le `WsAuthGuard` pour voir :
```typescript
console.log('WsAuthGuard - Handshake auth:', socket.handshake.auth);
console.log('WsAuthGuard - Handshake query:', socket.handshake.query);
console.log('WsAuthGuard - Handshake headers:', socket.handshake.headers);
console.log('WsAuthGuard - Token found:', extractedToken);
console.log('WsAuthGuard - Token validation result:', isValid);
```

### 4. Configuration CORS/Transport

**Configuration actuelle :**
- Transport : WebSocket (avec fallback polling)
- URL : `http://192.168.0.34:3001/chat`
- Headers sont envoyés via `extraHeaders`

**Question :** Le serveur Socket.IO est-il configuré pour accepter les `extraHeaders` avec le transport WebSocket ?

**Note :** Avec le transport WebSocket pur, les `extraHeaders` peuvent ne pas être transmis correctement. C'est pourquoi nous utilisons aussi `auth` et `query`.

## 📝 Documentation de référence

D'après `docs/frontend-match-messaging.md` :

> **Connexion WebSocket**
> - URL : `wss://<host>/chat` (Socket.IO v4)
> - Auth : même session BetterAuth. Le garde `WsAuthGuard` lit les headers du handshake (`Authorization`, cookies...)
> - CORS autorisé selon `app.corsOrigin`

**⚠️ Incohérence détectée :** La doc mentionne "headers du handshake" mais avec WebSocket, les headers personnalisés ne sont pas toujours disponibles. Il faut utiliser `auth` ou `query`.

## 🎯 Solutions proposées

### Solution 1 : Utiliser socket.handshake.auth (Recommandé)

**Backend :**
```typescript
// Dans WsAuthGuard
const token = socket.handshake.auth?.token;
if (!token) {
  console.error('WsAuthGuard: No token found in handshake.auth');
  socket.disconnect(true);
  return false;
}
```

**Avantage :** Standard Socket.IO v3+, fonctionne avec tous les transports.

### Solution 2 : Utiliser socket.handshake.query

**Backend :**
```typescript
// Dans WsAuthGuard
const token = socket.handshake.query?.token;
if (!token) {
  console.error('WsAuthGuard: No token found in handshake.query');
  socket.disconnect(true);
  return false;
}
```

**Avantage :** Visible dans l'URL, facile à débugger.

### Solution 3 : Support multi-sources (Robuste)

**Backend :**
```typescript
// Dans WsAuthGuard
const token = 
  socket.handshake.auth?.token ||
  socket.handshake.query?.token ||
  extractBearerToken(socket.handshake.headers?.authorization);

if (!token) {
  console.error('WsAuthGuard: No token found in auth, query, or headers');
  socket.disconnect(true);
  return false;
}
```

**Avantage :** Compatible avec tous les clients (web, mobile, etc.).

## 🧪 Tests de débogage suggérés

### Backend

Ajouter ces logs temporaires dans le `WsAuthGuard` ou le gateway :

```typescript
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {
  handleConnection(socket: Socket) {
    console.log('=== NEW SOCKET CONNECTION ===');
    console.log('Socket ID:', socket.id);
    console.log('Handshake.auth:', socket.handshake.auth);
    console.log('Handshake.query:', socket.handshake.query);
    console.log('Handshake.headers.authorization:', socket.handshake.headers?.authorization);
    console.log('Handshake.headers.cookie:', socket.handshake.headers?.cookie);
    console.log('==============================');
  }
}
```

### Frontend

Les logs sont déjà en place et montrent :
- ✅ Token est présent et envoyé
- ✅ Connexion WebSocket réussie
- ❌ Déconnexion immédiate par le serveur

## 💬 Question additionnelle : Envoi de messages asynchrone

> **Question :** Les chats doivent pouvoir s'envoyer même si seulement un des deux est sur le chat activement ?

**Réponse : OUI, absolument !** 

C'est le principe d'une messagerie asynchrone :

1. **Utilisateur A envoie un message** → Stocké en base de données
2. **Utilisateur B est hors-ligne** → Message marqué `delivered` mais pas `read`
3. **Utilisateur B se connecte plus tard** → Reçoit l'historique via `GET /messages`
4. **Utilisateur B ouvre le chat** → WebSocket émet `message.read` pour mettre à jour le statut

**Architecture actuelle :**
- ✅ Messages stockés en DB (persistent)
- ✅ WebSocket pour temps réel (optionnel)
- ✅ REST API pour l'historique (fallback)

**Le WebSocket ne devrait pas bloquer l'envoi de messages.** Si un utilisateur n'est pas connecté au WebSocket, il devrait quand même :
- Pouvoir envoyer via l'API REST (`POST /messages`)
- Recevoir les messages au prochain chargement (`GET /messages`)

## 🔄 Prochaines étapes

1. **[Backend]** Ajouter les logs de débogage dans le `WsAuthGuard`
2. **[Backend]** Identifier où le token doit être lu (auth, query, headers)
3. **[Backend]** Vérifier que la validation Better Auth ne rejette pas le token
4. **[Backend]** S'assurer qu'aucun middleware ne force la déconnexion
5. **[Frontend]** Ajuster le format d'envoi du token selon les findings backend
6. **[Test]** Valider que la connexion reste stable après authentification
7. **[Test]** Valider l'envoi/réception de messages en temps réel

## 📎 Fichiers concernés

**Frontend :**
- `src/providers/chat-socket-provider.tsx` - Configuration Socket.IO
- `src/hooks/use-chat-messages.ts` - Hook de gestion des messages
- `app/chat/[conversationId].tsx` - Interface de chat

**Backend (à vérifier) :**
- `src/chat/guards/ws-auth.guard.ts` (ou similaire) - Authentification WebSocket
- `src/chat/chat.gateway.ts` - Gateway Socket.IO
- Configuration Socket.IO dans `main.ts` ou module chat

---

**Date :** 9 novembre 2025  
**Statut :** 🔴 Bloquant - Impossible d'envoyer des messages  
**Priorité :** Haute - Fonctionnalité core de l'application
