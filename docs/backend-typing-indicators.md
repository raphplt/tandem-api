# Implémentation backend : Indicateurs de frappe (Typing Indicators)

Ce document décrit ce qu'il faut implémenter côté backend pour supporter les indicateurs de frappe dans le chat. Le frontend est déjà prêt et attend ces événements WebSocket.

## Vue d'ensemble

Les indicateurs de frappe permettent d'afficher quand l'autre personne est en train d'écrire un message. Cela améliore l'expérience utilisateur en donnant un feedback en temps réel.

## Événements WebSocket à implémenter

### Événements émis par le client

Le client envoie deux types d'événements :

#### 1. `typing.start`

Émis quand l'utilisateur commence à taper dans le champ de saisie.

**Payload :**
```typescript
{
  conversationId: string
}
```

**Comportement attendu :**
- Vérifier que l'utilisateur authentifié appartient bien à la conversation
- Diffuser l'événement `user.typing` à tous les autres participants de la conversation (sauf l'émetteur)
- Optionnel : gérer un timeout automatique (arrêter après 3-5 secondes si pas de `typing.stop`)

#### 2. `typing.stop`

Émis quand l'utilisateur arrête de taper (champ vidé, message envoyé, ou timeout).

**Payload :**
```typescript
{
  conversationId: string
}
```

**Comportement attendu :**
- Vérifier que l'utilisateur authentifié appartient bien à la conversation
- Diffuser l'événement `user.typing` avec `isTyping: false` à tous les autres participants

### Événements émis par le serveur

#### `user.typing`

Diffusé aux autres participants quand un utilisateur commence ou arrête de taper.

**Payload :**
```typescript
{
  conversationId: string;
  userId: string;        // ID de l'utilisateur qui tape
  isTyping: boolean;     // true = commence à taper, false = arrête de taper
}
```

**Diffusion :**
- Envoyer à tous les participants de la conversation SAUF l'utilisateur qui tape
- Utiliser la room Socket.IO de la conversation (`conversationId`)

## Implémentation technique

### Structure recommandée (NestJS avec Socket.IO)

```typescript
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway {
  // Map pour tracker les timeouts de typing par utilisateur/conversation
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  @SubscribeMessage('typing.start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId; // Récupéré depuis WsAuthGuard
    const { conversationId } = payload;

    // Vérifier que l'utilisateur appartient à la conversation
    const isMember = await this.conversationsService.isUserMember(
      conversationId,
      userId,
    );
    if (!isMember) {
      return { status: 'error', error: 'Not a member of this conversation' };
    }

    // Annuler le timeout précédent s'il existe
    const timeoutKey = `${userId}:${conversationId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Diffuser aux autres participants
    client.to(conversationId).emit('user.typing', {
      conversationId,
      userId,
      isTyping: true,
    });

    // Optionnel : timeout automatique après 5 secondes
    const timeout = setTimeout(() => {
      this.handleTypingStop(client, { conversationId });
      this.typingTimeouts.delete(timeoutKey);
    }, 5000);
    this.typingTimeouts.set(timeoutKey, timeout);

    return { status: 'ok' };
  }

  @SubscribeMessage('typing.stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data.userId;
    const { conversationId } = payload;

    // Vérifier l'appartenance
    const isMember = await this.conversationsService.isUserMember(
      conversationId,
      userId,
    );
    if (!isMember) {
      return { status: 'error', error: 'Not a member of this conversation' };
    }

    // Nettoyer le timeout
    const timeoutKey = `${userId}:${conversationId}`;
    const existingTimeout = this.typingTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(timeoutKey);
    }

    // Diffuser aux autres participants
    client.to(conversationId).emit('user.typing', {
      conversationId,
      userId,
      isTyping: false,
    });

    return { status: 'ok' };
  }

  // Nettoyer les timeouts lors de la déconnexion
  @OnEvent('disconnect')
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;
    // Nettoyer tous les timeouts de cet utilisateur
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.startsWith(`${userId}:`)) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(key);
      }
    }
  }
}
```

## Points importants

### 1. Validation et sécurité

- ✅ Vérifier que l'utilisateur appartient bien à la conversation avant de diffuser
- ✅ Utiliser le même système d'authentification que les autres événements (`WsAuthGuard`)
- ✅ Ne pas diffuser à l'utilisateur qui tape (éviter les boucles)

### 2. Gestion des rooms Socket.IO

- S'assurer que les utilisateurs sont bien dans la room de la conversation (`conversation.join`)
- Utiliser `socket.to(conversationId)` pour diffuser aux autres participants
- Ne pas utiliser `socket.emit()` qui enverrait aussi à l'émetteur

### 3. Gestion des timeouts

- Le frontend envoie déjà `typing.stop` après 3 secondes d'inactivité
- Le backend peut aussi implémenter un timeout de sécurité (5 secondes) pour éviter les états bloqués
- Nettoyer les timeouts lors de la déconnexion

### 4. Performance

- Les événements de typing sont fréquents, éviter les opérations lourdes (ex: requêtes DB) dans les handlers
- Utiliser un cache en mémoire pour vérifier l'appartenance aux conversations si nécessaire
- Limiter la fréquence d'émission (debounce) si nécessaire

## Tests à prévoir

1. **Test basique** : Deux utilisateurs dans la même conversation
   - User A tape → User B reçoit `user.typing` avec `isTyping: true`
   - User A arrête → User B reçoit `user.typing` avec `isTyping: false`

2. **Test de sécurité** : Utilisateur non membre
   - User C (non membre) essaie d'émettre `typing.start` → erreur retournée

3. **Test de timeout** : Timeout automatique
   - User A tape mais ne fait rien pendant 5 secondes → `typing.stop` automatique

4. **Test de déconnexion** : Nettoyage des timeouts
   - User A tape puis se déconnecte → timeout nettoyé, pas de fuite mémoire

## Intégration avec le frontend

Le frontend est déjà configuré pour :
- ✅ Émettre `typing.start` quand l'utilisateur tape
- ✅ Émettre `typing.stop` après 3 secondes d'inactivité ou quand le champ est vidé
- ✅ Écouter `user.typing` et afficher "{partnerName} écrit..." quand `isTyping: true`

Dès que le backend émettra `user.typing`, l'indicateur s'affichera automatiquement dans l'interface.

## Documentation API à mettre à jour

Ajouter dans `docs/frontend-match-messaging.md` :

### Événements émis par le client

| Event | Payload | Effet |
| --- | --- | --- |
| `typing.start` | `{ conversationId: string }` | Notifie que l'utilisateur commence à taper. Le serveur diffuse `user.typing` aux autres participants. |
| `typing.stop` | `{ conversationId: string }` | Notifie que l'utilisateur arrête de taper. Le serveur diffuse `user.typing` avec `isTyping: false`. |

### Événements reçus du serveur

| Event | Payload | Description |
| --- | --- | --- |
| `user.typing` | `{ conversationId: string; userId: string; isTyping: boolean }` | Notifie qu'un utilisateur commence (`isTyping: true`) ou arrête (`isTyping: false`) de taper dans la conversation. |

