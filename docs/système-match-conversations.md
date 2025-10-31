# Système de Match et Conversations - Documentation Tandem

## Vue d'ensemble

Le système Tandem est conçu autour de deux concepts principaux :

1. **Le système de Match** : Algorithme d'appariement quotidien basé sur la compatibilité
2. **Le système de Conversations** : Échanges en temps réel via Socket.IO avec gestion de l'expiration

---

## 🎯 Partie 1 : Système de Match

### 1.1 Architecture

Le système de match connecte les utilisateurs entre eux selon plusieurs critères de compatibilité. Chaque utilisateur peut avoir **maximum 1 match par jour**.

### 1.2 Entité Match

**Fichier** : `src/matches/entities/match.entity.ts`

#### Propriétés principales

- **Status** : `pending`, `accepted`, `rejected`, `expired`, `cancelled`
- **Type** : `daily`, `manual`, `premium`
- **Compatibility Score** : Score de compatibilité sur 100
- **Scoring Breakdown** : Détail du calcul (âge, localisation, intérêts, valeurs, bonus)
- **Expiration** : 24h après la création
- **Dates** : `matchDate`, `expiresAt`, `acceptedAt`, `rejectedAt`, etc.

#### États du Match

```typescript
enum MatchStatus {
  PENDING = 'pending', // Match créé, en attente d'acceptation
  ACCEPTED = 'accepted', // Match accepté par les deux parties
  REJECTED = 'rejected', // Match rejeté
  EXPIRED = 'expired', // Match expiré sans réponse
  CANCELLED = 'cancelled', // Match annulé manuellement
}
```

### 1.3 Algorithme de Scoring

**Fichier** : `src/matches/matches.service.ts` (lignes 467-600)

Le score de compatibilité est calculé selon plusieurs critères pondérés :

#### Poids des critères

```typescript
SCORING_WEIGHTS = {
  ageCompatibility: 0.2, // 20%
  locationCompatibility: 0.15, // 15%
  interestCompatibility: 0.25, // 25%
  valueCompatibility: 0.2, // 20%
  responseRateBonus: 0.1, // 10%
  activityBonus: 0.05, // 5%
  verificationBonus: 0.05, // 5%
};
```

#### Détail du calcul

##### 1. Compatibilité d'âge (20%)

- Différence ≤ 2 ans : 100 points
- Différence ≤ 5 ans : 80 points
- Différence ≤ 10 ans : 60 points
- Différence ≤ 15 ans : 40 points
- Différence > 15 ans : 20 points

##### 2. Compatibilité de localisation (15%)

- Même ville : 100 points
- Même pays : 70 points
- Pays différents : 30 points

##### 3. Compatibilité d'intérêts (25%)

- Calcul : `(intérêts communs / total intérêts) × 100`
- Exemple : 3 intérêts communs sur 5 → 60 points

##### 4. Compatibilité de valeurs (20%)

- Même calcul que pour les intérêts
- Proportion de valeurs communes

##### 5. Bonus de réponse (10%)

- Basé sur l'historique de réponse (constant actuellement à 75)

##### 6. Bonus d'activité (5%)

- Basé sur l'activité récente (constant actuellement à 80)

##### 7. Bonus de vérification (5%)

- Profil vérifié : +50 points
- Si les deux sont vérifiés : 100 points

#### Score minimum requis

**60 points** minimum pour qu'un match soit créé.

### 1.4 Flux de Création d'un Match

**Fichier** : `src/matches/matches.service.ts` (lignes 41-86)

```
1. A[Création Match trouve]
   ↓
2. B[Validation Users & Profiles]
   ↓
3. C{Match existe déjà?}
   ├─ Oui → D[Erreur: Match existe]
   └─ Non → E[Vérifier limite quotidienne]
         ↓
4. F{Limite atteinte?}
   ├─ Oui → G[Erreur: Limite atteinte]
   └─ Non → H[Calculer score]
         ↓
5. I{Score >= 60?}
   ├─ Non → J[Erreur: Score insuffisant]
   └─ Oui → K[Créer match]
         ↓
6. L[Expiration: 24h]
   ↓
7. M[Status: PENDING]
```

#### Validations

1. **Users existent** et sont actifs
2. **Profiles existent** et sont actifs
3. **Pas de match existant** entre ces users
4. **Limite quotidienne** respectée (1 match/jour par user)
5. **Score minimum** de 60 atteint

### 1.5 Génération Quotidienne de Matches

**Fichier** : `src/matches/matches.service.ts` (lignes 337-398)

#### Algorithme de génération

```typescript
async generateDailyMatches(date: string) {
  // 1. Récupérer tous les profils actifs et complets
  const profiles = await getActiveProfiles();

  // 2. Parcourir chaque profil
  for each profile1 in profiles {
    if profile1 déjà utilisé: continue

    for each profile2 in profiles {
      if profile2 déjà utilisé: continue
      if match existe déjà: continue

      // 3. Calculer le score
      score = calculateCompatibility(profile1, profile2);

      // 4. Si score >= 60, créer match
      if score >= 60 {
        createMatch(profile1, profile2);
        marquer les deux comme utilisés;
        break; // Passer au profil suivant
      }
    }
  }
}
```

#### Limitations

- 1 match par jour maximum par utilisateur
- Score minimum de 60
- Profils actifs et complets uniquement
- Pas de doublons (vérification bidirectionnelle)

### 1.6 Actions sur un Match

#### Accepter un Match

```typescript
await matchesService.acceptMatch(matchId, userId);
```

- **Effet** : `status = ACCEPTED`, `isMutual = true`
- **Prérequis** : Match en status PENDING, non expiré
- **Résultat** : Peut créer une conversation (voir partie 2)

#### Rejeter un Match

```typescript
await matchesService.rejectMatch(matchId, userId);
```

- **Effet** : `status = REJECTED`

#### Annuler un Match

```typescript
await matchesService.cancelMatch(matchId, userId);
```

- **Effet** : `status = CANCELLED`

#### Expirer un Match

Tâche planifiée quotidienne qui expire automatiquement les matches en PENDING après 24h.

```typescript
await matchesService.expireMatches(); // Passent en EXPIRED
```

---

## 💬 Partie 2 : Système de Conversations

### 2.1 Architecture

Les conversations sont créées à partir d'un **match accepté**. Elles permettent l'échange de messages en temps réel via Socket.IO.

### 2.2 Entité Conversation

**Fichier** : `src/conversations/entities/conversation.entity.ts`

#### Propriétés principales

- **Status** : `active`, `expired`, `closed`, `archived`
- **Type** : `daily`, `extended`, `premium`
- **Durée** : 24 heures par défaut
- **Extension** : Possible jusqu'à 3 fois
- **Read status** : `isReadByUser1`, `isReadByUser2`
- **Messages** : Relation One-to-Many avec l'entité Message

#### États de la Conversation

```typescript
enum ConversationStatus {
  ACTIVE = 'active', // Conversation active
  EXPIRED = 'expired', // Conversation expirée (> 24h)
  CLOSED = 'closed', // Conversation fermée manuellement
  ARCHIVED = 'archived', // Conversation archivée
}
```

#### Durée et Extensions

- **Durée initiale** : 24 heures
- **Extension** : +24 heures supplémentaires
- **Maximum** : 3 extensions possibles (soit 4 × 24h = 96h au total)
- **Condition** : Conversation extensible si moins de 2h restantes

### 2.3 Création d'une Conversation

**Fichier** : `src/conversations/conversations.service.ts` (lignes 414-465)

#### À partir d'un Match

```typescript
async createFromMatch(matchId: string) {
  // 1. Valider que le match existe et est ACCEPTED
  const match = await validateMatch(matchId);

  // 2. Vérifier qu'aucune conversation n'existe déjà
  if (existingConversation) throw error;

  // 3. Créer la conversation
  const conversation = {
    user1Id: match.user1Id,
    user2Id: match.user2Id,
    matchId: match.id,
    status: 'active',
    type: 'daily',
    startTime: now,
    expiresAt: now + 24h,
    messageCount: 0,
  };

  // 4. Sauvegarder
  return await save(conversation);
}
```

#### Validations

1. Match existe et status = `ACCEPTED`
2. Aucune conversation existante entre ces users
3. Users actifs

### 2.4 Cycle de Vie d'une Conversation

```
A[Match ACCEPTED] → B[Conversation ACTIVE]
                        ↓
                    C{24h écoulées?}
                    ├─ Oui → D[Conversation EXPIRED]
                    └─ Non → E{Extension demandée?}
                            ├─ Oui (< 2h) → F[Conversation EXTENDED +24h]
                            └─ Non → G[Fermeture manuelle?]
                                    ├─ Oui → H[Conversation CLOSED]
                                    └─ Non → C (boucle)
```

### 2.5 Actions sur une Conversation

#### Étendre une Conversation

```typescript
await conversationsService.extendConversation(conversationId, userId);
```

- **Durée ajoutée** : 24 heures
- **Limite** : Maximum 3 extensions
- **Condition** : Moins de 2h restantes
- **Effet** : `type = EXTENDED`, `expiresAt` prolongé

#### Fermer une Conversation

```typescript
await conversationsService.closeConversation(conversationId, userId);
```

- **Effet** : `status = CLOSED`, `closedAt` enregistré

#### Archiver une Conversation

```typescript
await conversationsService.archiveConversation(conversationId, userId);
```

- **Effet** : `status = ARCHIVED`, `archivedAt` enregistré

#### Marquer comme lue

```typescript
await conversationsService.markAsRead(conversationId, userId);
```

- **Effet** : Met à jour `isReadByUser1` ou `isReadByUser2`

### 2.6 Expiration Automatique

Tâche planifiée quotidienne qui expire automatiquement les conversations actives dépassant leur `expiresAt`.

```typescript
await conversationsService.expireConversations(); // Passent en EXPIRED
```

---

## 🔌 Partie 3 : Système Socket.IO (Messages en Temps Réel)

### 3.1 Architecture Socket.IO

**Fichier** : `src/messages/messages.gateway.ts`

#### Configuration

- **Namespace** : `/chat`
- **Adapter** : Redis (pour clustering multi-instances)
- **Authentication** : `WsAuthGuard` (JWT-based)
- **CORS** : Configurable via `app.corsOrigin`

#### Adapter Redis

**Fichier** : `src/common/adapters/redis-io.adapter.ts`

L'utilisation de Redis permet :

- **Scalabilité** : Plusieurs instances serveur peuvent gérer les connexions
- **Distribution** : Les messages sont distribués entre tous les serveurs
- **Persistence** : Les rooms et connexions sont partagées

```typescript
// Configuration dans main.ts
const redisAdapter = new RedisIoAdapter(app);
await redisAdapter.connectToRedis();
app.useWebSocketAdapter(redisAdapter);
```

### 3.2 Authentification WebSocket

Toutes les connexions Socket.IO passent par `WsAuthGuard` :

```typescript
@UseGuards(WsAuthGuard)
export class MessagesGateway {
  // Le token JWT est validé et l'utilisateur est attaché à client.data.user
}
```

#### Connexion

```typescript
handleConnection(client: AuthenticatedSocket) {
  // Validation de l'origine
  // client.data.user est disponible après validation JWT
}
```

### 3.3 Rooms (Chambres)

Les rooms Socket.IO sont utilisées pour grouper les connexions par conversation.

#### Rejoindre une Conversation

```typescript
socket.emit('conversation.join', { conversationId });
```

**Côté serveur** (lignes 79-108) :

1. Valider que l'user appartient à la conversation
2. Joindre le client à la room `conversationId`
3. Émettre confirmation

```typescript
@SubscribeMessage('conversation.join')
async handleConversationJoin(client, { conversationId }) {
  // Valider l'accès
  await validateConversationAccess(conversationId, user.id);
  // Joindre la room
  await client.join(conversationId);
}
```

#### Quitter une Conversation

```typescript
socket.emit('conversation.leave', { conversationId });
```

### 3.4 Système de Messages

**Fichier** : `src/messages/entities/message.entity.ts`

#### Types de Messages

```typescript
enum MessageType {
  TEXT = 'text', // Message texte
  IMAGE = 'image', // Message avec image
  EMOJI = 'emoji', // Message émoji
  SYSTEM = 'system', // Message système (auto)
}
```

#### États du Message

```typescript
enum MessageStatus {
  SENT = 主要是, // Message envoyé
  DELIVERED = 'delivered', // Message livré
  READ = 'read', // Message lu
  FAILED = 'failed', // Échec d'envoi
}
```

#### Propriétés

- **Content** : 2000 caractères maximum
- **Reply** : Support des réponses avec `replyToId`
- **Edit** : Modification possible dans les 5 premières minutes
- **Delete** : Suppression soft (`isDeleted = true`)
- **Metadata** : JSON pour fichiers, emojis, etc.

### 3.5 Émission de Messages

#### Côté Client

```typescript
socket.emit('message.send', {
  content: 'Hello!',
  conversationId: 'conv-123',
  type: 'text',
});
```

#### Côté Serveur (lignes 136-159)

**Fichier** : `src/messages/messages.gateway.ts`

```typescript
@SubscribeMessage('message.send')
async handleMessageSend(client, createMessageDto) {
  // 1. Créer le message en DB via MessagesService
  const message = await messagesService.create(dto, user.id);

  // 2. Joindre automatiquement la room si nécessaire
  await client.join(message.conversationId);

  // 3. Retourner le message au client émetteur
  return { status: 'ok', message };
}
```

#### Service de Messages (lignes 40-102)

**Fichier** : `src/messages/messages.service.ts`

1. **Validation** : Conversation existe et user autorisé
2. **Vérification** : Conversation active (non expirée)
3. **Création** : Enregistrement en DB avec status `SENT`
4. **Update** : Mise à jour de `lastMessageAt` et `messageCount`
5. **Event** : Émission d'event `MESSAGE_CREATED_EVENT`

### 3.6 Broadcast de Messages (Temps Réel)

#### Événements NestJS + Socket.IO

Le système utilise `EventEmitter2` pour connecter les services aux WebSockets.

#### Événement : Nouveau Message (lignes 187-211)

```typescript
@OnEvent(MESSAGE_CREATED_EVENT)
async handleMessageCreated(event: MessageCreatedEvent) {
  // 1. Marquer comme DELIVERED
  await markAsDelivered(event.message.id);

  // 2. Broadcast à tous les clients dans la room conversationId
  this.server.to(event.conversationId).emit('message.new', {
    ...event.message,
    status: 'DELIVERED'
  });
}
```

**Flux** :

```
MessageService.create()
  → EventEmitter.emit(MESSAGE_CREATED_EVENT)
    → MessagesGateway.handleMessageCreated()
      → Socket.to(room).emit('message.new')
```

#### Événements Socket disponibles

**Côté Client** (reçus automatiquement) :

```typescript
socket.on('message.new', (message) => {
  // Nouveau message dans la conversation
});

socket.on('message.updated', (message) => {
  // Message édité
});

socket.on('message.deleted', (message) => {
  // Message supprimé
});

socket.on('message.read', (event) => {
  // Messages marqués comme lus
});
```

### 3.7 Marquage de Lecture

#### Côté Client

```typescript
socket.emit('message.read', { conversationId });
```

#### Côté Serveur (lignes 161-185)

```typescript
@SubscribeMessage('message.read')
async handleMessageRead(client, { conversationId }) {
  // Marquer tous les messages non-lus de la conversation comme READ
  await markConversationAsRead(conversationId, user.id);

  // Emit event pour notifier l'autre partie
  emit(MESSAGE_READ_EVENT);
  return { status: 'ok', conversationId };
}
```

### 3.8 Gestion de la Connexion/Déconnexion

#### Connexion

```typescript
handleConnection(client: AuthenticatedSocket) {
  // Validation CORS
  // Logging
}
```

#### Déconnexion

```typescript
handleDisconnect(client: AuthenticatedSocket) {
  // Nettoyage automatique des rooms
  // Logging
}
```

**Note** : Les rooms Socket.IO sont automatiquement quittées à la déconnexion.

### 3.9 Exemple de Flux Complet

```
1. U1 envoie message via S1
2. S1 → GW (gateway)
3. GW → MS (messages service)
4. MS → DB (sauvegarde message)
5. DB → MS (confirmé)
6. MS → GW (emit event)
7. GW broadcast → S2 (socket utilisateur 2)
8. S2 → U2 (reçoit le message)
```

---

## 📊 Résumé des Flux Principaux

### Flux Complet : Match → Conversation → Messages

```
A[Génération Quotidienne] → B[Match PENDING]
                              ↓
                          C{User accepte?}
                              ├─ Oui → D[Match ACCEPTED]
                              └─ Non → E[Match REJECTED/EXPIRED]
orientation                                      ↓
D → F[Création Conversation]
  ↓
G[Conversation ACTIVE]
  ↓
H[Connexion Socket.IO]
  ↓
I[Echange de Messages]
  ↓
J{24h écoulées?}
  ├─ Oui → K[Conversation EXPIRED]
  └─ Extension? → L[Conversation EXTENDED]
               → J (boucle)
```

### Durées et Limitations

| Élément               | Durée   | Extension | Limite        |
| --------------------- | ------- | --------- | ------------- |
| **Match**             | 24h     | ❌        | 1/jour/user   |
| **Conversation**      | 24h     | ✅ (×3)   | 96h max total |
| **Message Edit**      | 5 min   | ❌        | -             |
| **Message Retention** | 2 jours | ❌        | -             |

### Points d'Entrée API

#### Matches

- `POST /matches` - Créer un match
- `GET /matches/:id` - Récupérer un match
- `POST /matches/:id/accept` - Accepter
- `POST /matches/:id/reject` - Rejeter
- `POST /matches/daily` - Générer matches quotidiens

#### Conversations

- `POST /conversations` - Créer une conversation
- `POST /conversations/:id/extend` - Étendre
- `POST /conversations/:id/close` - Fermer
- `GET /conversations/user/:userId` - Conversations d'un user
- `GET /conversations/active` - Conversation active

#### Messages

- `GET /messages/conversation/:id` - Messages d'une conversation
- `POST /messages/search` - Rechercher dans messages
- `GET /messages/unread` - Nombre de non-lus

#### Socket.IO Events

- `conversation.join` / `conversation.leave`
- `message.send`
- `message.read`
- `message.new` (reçu)
- `message.updated` (reçu)
- `message.deleted` (reçu)

---

## 🔐 Sécurité

### Authentification

- **REST API** : JWT via `@UseGuards(JwtAuthGuard)`
- **WebSocket** : tempoJWT via `WsAuthGuard` lors de la connexion

### Validation d'Accès

- Vérification que l'user appartient bien au match/conversation
- Validation des états (ACTIVE, non expiré, etc.)
- Limites de rate/quota respectées

### CORS

- Configuration stricte via `app.corsOrigin`
- Validation dans `handleConnection()`

---

## 🚀 Performance & Scalabilité

### Redis Adapter

- Permet le clustering de multiples instances serveur
- Partage des rooms Socket.IO entre instances
- Distribution automatique des messages

### Optimisations

- Indexation DB sur `status`, `matchDate`, `expiresAt`
- Query optimization avec TypeORM
- Soft delete pour audit
- Pagination des messages (50 par défaut)

### Monitoring

- Logs structurés via NestJS Logger
- Events pour métriques (création, lecture, etc.)
- Tâches planifiées pour expiration automatique

---

## 📝 Notes Importantes

### Règles Métier Clés

1. **1 match par jour** : Un user ne peut avoir qu'un seul match DAILY par jour
2. **Score minimum 60** : Seuil de compatibilité pour créer un match
3. **Match requis** : Une conversation nécessite un match ACCEPTED
4. **Expiration automatique** : Matches et conversations expirés automatiquement
5. **Extension limitée** : Maximum 3 extensions de conversation
6. **Edit limité** : Messages éditables seulement dans les 5 premières minutes

### Évolutions Possibles

- Algorithme de matching plus sophistiqué (ML)
- Système de swipe
- Matchs premium (plus de critères)
- Notifications push
- Modération automatique des messages
- Sauvegarde des conversations expirées (optionnelle)
- Analytics avanc到此 sur les matches
