# Guide API Match & Messages (frontend Expo)

Ce guide permet de décrire le fonctionnement actuel du système de matching et de messagerie temps-réel côté API, ainsi que les endpoints REST et événements WebSocket disponibles pour le front Expo/React Native.

## Authentification & formats

- Toutes les routes REST exposées ici utilisent `AuthGuard` (session BetterAuth). Le client Expo doit envoyer le header `Authorization: Bearer <token>` configuré côté BetterAuth.
- Les routes `matches` exposent désormais une surface admin (CRUD complet réservé au rôle `admin`) **et** une surface utilisateur (`/matches/me`, `/matches/daily`, `/matches/:id/(accept|reject|cancel)`) accessible à tout utilisateur authentifié.
- Les routes `conversations` suivent la même logique : surface admin et endpoints utilisateurs (`/conversations/me`, `/conversations/active/me`, `/conversations/:id/(extend|close|archive|read)`, `/conversations/from-match/:matchId`).
- Les routes `messages` utilisent `OwnershipGuard` : l'utilisateur connecté doit être membre de la conversation associée.
- Toutes les dates sont renvoyées en ISO 8601 (`string` côté HTTP). Les nombres décimaux (`compatibilityScore`) sont sérialisés en chaîne JSON.

## Système de match

### Entités & enums (src/matches/entities/match.entity.ts)

```ts
export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum MatchType {
  DAILY = 'daily',
  MANUAL = 'manual',
  PREMIUM = 'premium',
}

export interface MatchResponse {
  id: string;
  user1Id: string;
  user2Id: string;
  profile1Id: string;
  profile2Id: string;
  status: MatchStatus;
  type: MatchType;
  compatibilityScore: number; // 0-100
  scoringBreakdown?: {
    ageCompatibility: number;
    locationCompatibility: number;
    interestCompatibility: number;
    valueCompatibility: number;
    responseRateBonus: number;
    activityBonus: number;
    verificationBonus: number;
  };
  matchDate: string; // date uniquement (UTC)
  expiresAt?: string;
  acceptedAt?: string;
  user1AcceptedAt?: string;
  user2AcceptedAt?: string;
  rejectedAt?: string;
  user1RejectedAt?: string;
  user2RejectedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
  isActive: boolean;
  isMutual: boolean;
  metadata?: Record<string, unknown> & {
    matchingAlgorithm?: string;
    matchingVersion?: string;
    timezoneOffset?: number;
    user1Preferences?: unknown;
    user2Preferences?: unknown;
  };
  createdAt: string;
  updatedAt: string;
  // champs dérivés exposés par l'entity getter
  isExpired: boolean;
  isPending: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  daysSinceMatch: number;
  timeUntilExpiry?: number; // heures restantes
}
```

`CreateMatchDto` reprend les champs `user*Id`, `profile*Id`, `matchDate`, accepte `status`, `type`, `compatibilityScore`, `scoringBreakdown`, `expiresAt`, `metadata`. `UpdateMatchDto` est un `Partial<CreateMatchDto>`.

### Logique métier notable (MatchesService)

- Limite : 1 match quotidien par utilisateur (`MAX_DAILY_MATCHES`).
- Chaque acceptation est stockée par utilisateur (`user1AcceptedAt` / `user2AcceptedAt`). Le statut ne passe à `accepted` que lorsque les deux côtés ont répondu positivement, ce qui garantit un consentement mutuel.
- Expiration par défaut : `MATCH_EXPIRY_HOURS = 24` à partir de la création.
- Score de compatibilité minimal pour créer un match : `60`.
- La vérification de limite quotidienne compte désormais les occurrences où l'utilisateur apparaît en `user1` **ou** `user2`, évitant les duplications lors du batch quotidien.
- Méthodes disponibles côté service pour la suite du produit (à exposer via routes dédiées) :
  - `findByUserId(userId)` : liste des matches actifs d'un utilisateur.
  - `findDailyMatch(userId, date)` : match quotidien pour une date.
  - `acceptMatch(id, userId)`, `rejectMatch(id, userId)`, `cancelMatch(id, userId)` : cycle de vie utilisateur.
  - `generateDailyMatches(date)` : match-making batch simple.

### Endpoints REST existants (`src/matches/matches.controller.ts`)

| Méthode | Route | Auth | Body | Réponse |
| --- | --- | --- | --- | --- |
| POST | `/matches` | Admin uniquement | `CreateMatchDto` | `MatchResponse` |
| GET | `/matches` | Admin uniquement | — | `MatchResponse[]` (actifs) |
| GET | `/matches/:id` | Admin uniquement | — | `MatchResponse` |
| PATCH | `/matches/:id` | Admin uniquement | `UpdateMatchDto` | `MatchResponse` |
| DELETE | `/matches/:id` | Admin uniquement | — | `204 No Content` (soft delete `isActive=false`) |

#### Endpoints utilisateur exposés

| Méthode | Route | Auth | Body | Réponse | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/matches/me` | Session BetterAuth | — | `MatchResponse[]` (récents en premier) | Retourne toutes les paires actives/acceptées de l'utilisateur courant. |
| GET | `/matches/daily?date=YYYY-MM-DD` | Session BetterAuth | — | `MatchResponse \| null` | Par défaut, `date` = aujourd'hui (UTC). |
| POST | `/matches/:id/accept` | Session BetterAuth | — | `MatchResponse` | Consigne `userXAcceptedAt`. Le statut ne passe à `accepted` qu'après les deux réponses. |
| POST | `/matches/:id/reject` | Session BetterAuth | — | `MatchResponse` | Consigne `userXRejectedAt` et passe le match en `rejected`. |
| POST | `/matches/:id/cancel` | Session BetterAuth | — | `MatchResponse` | Pour annuler mutuellement un match encore `pending`. |

> ⚠️ `MatchResponse` inclut désormais les champs `user1AcceptedAt`, `user2AcceptedAt`, `user1RejectedAt`, `user2RejectedAt` pour aider le front à afficher “en attente de l'autre”.

## Système de conversations & messages

### Enums & entités clés

```ts
// src/conversations/entities/conversation.entity.ts
enum ConversationStatus { ACTIVE='active', EXPIRED='expired', CLOSED='closed', ARCHIVED='archived' }
enum ConversationType { DAILY='daily', EXTENDED='extended', PREMIUM='premium' }

export interface ConversationResponse {
  id: string;
  user1Id: string;
  user2Id: string;
  matchId: string;
  status: ConversationStatus;
  type: ConversationType;
  startTime: string;
  expiresAt: string;
  extendedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  isActive: boolean;
  isReadByUser1: boolean;
  isReadByUser2: boolean;
  lastMessageAt?: string;
  messageCount: number;
  metadata?: {
    timezoneOffset?: number;
    extensionCount?: number;
    lastActivity?: string;
    user1LastSeen?: string;
    user2LastSeen?: string;
  };
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isActiveConversation: boolean;
  timeUntilExpiry: number; // heures restantes
  duration: number; // heures depuis startTime
  canBeExtended: boolean; // <2h restantes et conversation daily active
  hasUnreadMessages: boolean;
}
```

### Endpoints REST conversations

| Méthode | Route | Auth | Body | Retour | Notes |
| --- | --- | --- | --- | --- | --- |
| POST | `/conversations` | Admin uniquement | `CreateConversationDto` | `ConversationResponse` | Création manuelle (debug/admin). |
| GET | `/conversations` | Admin uniquement | — | `ConversationResponse[]` | Filtrage/CRUD interne. |
| GET | `/conversations/:id` | Admin uniquement | — | `ConversationResponse` | Lecture par ID. |
| PATCH | `/conversations/:id` | Admin uniquement | `UpdateConversationDto` | `ConversationResponse` | Mise à jour globale. |
| DELETE | `/conversations/:id` | Admin uniquement | — | `204 No Content` | Soft delete (`isActive=false`). |

#### Endpoints utilisateur

| Méthode | Route | Auth | Body | Retour | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/conversations/me` | Session BetterAuth | — | `ConversationResponse[]` | Liste toutes les conversations de l'utilisateur (ordre `lastMessageAt DESC`). |
| GET | `/conversations/active/me` | Session BetterAuth | — | `ConversationResponse \| null` | Retourne la conversation quotidienne en cours s'il y en a une. |
| POST | `/conversations/from-match/:matchId` | Session BetterAuth | — | `ConversationResponse` | Instancie une conversation après acceptation mutuelle. L'utilisateur doit être participant du match. |
| POST | `/conversations/:id/extend` | Session BetterAuth | — | `ConversationResponse` | Ajoute +24h (max 3 fois) si `canBeExtended=true`. |
| POST | `/conversations/:id/close` | Session BetterAuth | — | `ConversationResponse` | Clôture volontaire de la conversation. |
| POST | `/conversations/:id/archive` | Session BetterAuth | — | `ConversationResponse` | Archive l'historique (statut `archived`). |
| POST | `/conversations/:id/read` | Session BetterAuth | — | `ConversationResponse` | Met à jour `isReadByUserX` et `metadata.userXLastSeen`. |

```ts
// src/messages/entities/message.entity.ts
enum MessageType { TEXT='text', IMAGE='image', EMOJI='emoji', SYSTEM='system' }
enum MessageStatus { SENT='sent', DELIVERED='delivered', READ='read', FAILED='failed' }

export interface MessageResponse {
  id: string;
  authorId: string;
  conversationId: string;
  content: string; // '[Message deleted]' si supprimé
  type: MessageType;
  status: MessageStatus;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  isDeleted: boolean;
  isEdited: boolean;
  metadata?: {
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    thumbnailUrl?: string;
    emoji?: string;
    systemMessage?: string;
    deliveryAttempts?: number;
    lastDeliveryAttempt?: string;
  };
  createdAt: string;
  updatedAt: string;
  isSystemMessage: boolean; // dérivé du type
  isMediaMessage: boolean;
  isEmojiMessage: boolean;
  ageInMinutes: number;
  ageInHours: number;
  ageInDays: number;
  formattedAge: string; // ex: '30m ago'
}
```

`CreateMessageDto` impose :

- `content` min 1 / max 2000 caractères.
- `conversationId` obligatoire.
- `type` par défaut `text`.
- `metadata` requis selon le type (`fileUrl` pour image, `emoji` pour emoji).

`UpdateMessageDto` est un `Partial<CreateMessageDto>`. L'édition est possible < 5 minutes après envoi et si le message n'est pas supprimé.

### Endpoints REST disponibles (`src/messages/messages.controller.ts`)

| Méthode | Route | Query | Body | Retour | Notes |
| --- | --- | --- | --- | --- | --- |
| POST | `/messages` | — | `CreateMessageDto` | `MessageResponse` | L'utilisateur connecté devient `authorId`. Rejette si conversation inactive. |
| GET | `/messages` | `conversationId` (obligatoire), `limit` (<=100, défaut 50), `offset` (>=0) | — | `MessageResponse[]` ordonnés desc (dernier en premier) | Vérifie que l'utilisateur est membre de la conversation. |
| GET | `/messages/:id` | — | — | `MessageResponse` | Accès réservé à l'auteur ou à un participant via OwnershipGuard. |
| PATCH | `/messages/:id` | — | `UpdateMessageDto` | `MessageResponse` | Autorisé uniquement à l'auteur, < 5 min, message non supprimé. |
| DELETE | `/messages/:id` | — | — | `MessageResponse` | Soft delete : `content` devient `"[Message deleted]"`. |

> 🔁 L'endpoint `GET /messages` retourne aussi les messages soft-supprimés. Utiliser `isDeleted` et le contenu standardisé `"[Message deleted]"` pour l'affichage.

Fonctions supplémentaires côté service auxquelles raccorder le front :

- `markConversationAsRead(conversationId, userId)` (déjà appelé via WS `message.read`) met à jour les statuts `isReadByUserX` et `metadata.userXLastSeen` en plus de passer les messages en `read`.
- `searchMessages(query, userId, conversationId?, limit?)` pour recherche texte.
- `getUnreadCount(userId)` & `getUnreadCountForConversation(conversationId, userId)`.

> ℹ️ Toutes les opérations utilisateur (`findByUserId`, `extendConversation`, `closeConversation`, `archiveConversation`, `markAsRead`, `createFromMatch`) sont désormais exposées via les routes décrites ci-dessus.

## WebSocket temps-réel (Socket.IO namespace `/chat`)

### Connexion

- URL : `wss://<host>/chat` (Socket.IO v4).
- Auth : même session BetterAuth. Le garde `WsAuthGuard` lit les headers du handshake (`Authorization`, cookies...).
- CORS autorisé selon `app.corsOrigin` (fallback `http://localhost:3000`).

### Événements émis par le client

| Event | Payload | Effet |
| --- | --- | --- |
| `conversation.join` | `{ conversationId: string }` | Rejoint la room Socket.IO de la conversation après vérification d'appartenance. |
| `conversation.leave` | `{ conversationId: string }` | Quitte la room. |
| `message.send` | `CreateMessageDto` | Crée un message. Retour `{ status: 'ok', message: MessageResponse }`. Rejoint automatiquement la room si pas déjà membre. |
| `message.update` | `{ messageId: string; update: UpdateMessageDto }` | Met à jour un message (mêmes règles que REST). Retour `{ status: 'ok', message: MessageResponse }`. |
| `message.delete` | `{ messageId: string }` | Supprime un message (soft delete). Retour `{ status: 'ok', message: MessageResponse }`. |
| `message.read` | `{ conversationId: string }` | Marque la conversation comme lue (messages + `isReadByUserX`, `metadata.userXLastSeen`). Retour `{ status: 'ok', conversationId }`. |

Les payloads sont validés côté serveur via `ValidationPipe` (whitelist + transformation), donc envoyer uniquement les champs déclarés.

### Événements reçus du serveur

| Event | Payload | Description |
| --- | --- | --- |
| `message.new` | `MessageResponse` | Diffusé à toute la room sur la création. Le statut est promu à `delivered` et `MessagesService.markAsDelivered` est déclenché côté serveur. |
| `message.updated` | `MessageResponse` | Diffusé lors d'une édition. |
| `message.deleted` | `MessageResponse` | Diffusé lors d'une suppression (contient `isDeleted=true`, `content='[Message deleted]'`). |
| `message.read` | `{ conversationId: string; userId: string; unreadCount: number }` | Notifie les participants qu'un utilisateur a tout lu. |

### Séquence type côté client

1. Une fois authentifié, instancier `io('/chat', { withCredentials: true, extraHeaders: { Authorization: 'Bearer ...' }})`.
2. Pour chaque conversation à afficher, appeler `socket.emit('conversation.join', { conversationId })`.
3. Charger l'historique via `GET /messages?conversationId=...`.
4. Sur envoi d'un message :

   ```ts
   socket.emit('message.send', { conversationId, content, type, metadata }, (ack) => {
     if (ack.status === 'ok') {
       // ack.message contient le message normalisé
     }
   });
   ```

5. Écouter `message.new` pour alimenter le flux ; si l'auteur est l'utilisateur courant, fusionner avec l'état local pour éviter les doublons.
6. Lorsqu'un thread est lu, émettre `message.read` pour remettre le compteur à zéro.

### Rappels front

- Les messages sont retournés dans l'ordre décroissant (`createdAt DESC`) par la route `GET /messages`; inverser côté client si nécessaire.
- `metadata.deliveryAttempts` et `lastDeliveryAttempt` sont gérés serveur, ne pas surcharger côté client.
- Pour les messages média, prévoir un stockage S3/R2 et renseigner `metadata.fileUrl`, `metadata.fileType`, `metadata.thumbnailUrl` avant d'appeler `message.send`.
- Les messages système (`type='system'`) sont créés via `MessagesService.createSystemMessage` (pas exposé au front). Si besoin dans l'app, prévoir une API ou un event spécifique.

## Points d'attention pour la suite

- Brancher le front Expo sur les nouvelles routes utilisateur (matches + conversations) pour se passer du proxy admin.
- Ajouter des garde-fous côté API (`rate limiting`, validation `matchDate` vs timezone) avant mise en prod.
- Prévoir un mapping client pour afficher les `MatchStatus` et `MessageStatus` (ex: badge "En attente") et formater les durées (`timeUntilExpiry`).
- Si l'app Expo doit gérer la reconnexion Socket.IO, réémettre `conversation.join` après chaque reconnect.
