# Messagerie : évènements front-back

Documentation des évènements Socket.IO à utiliser dans l’app Expo / React Native pour la messagerie (statuts, lectures, indicateurs de frappe…).

## Évènements émis par le client

| Event | Payload | Effet |
| --- | --- | --- |
| `conversation.join` | `{ conversationId: string }` | Rejoint la room Socket.IO de la conversation (obligatoire pour recevoir les messages / statuts). |
| `conversation.leave` | `{ conversationId: string }` | Quitte la room lorsqu’on ferme l’écran. |
| `message.send` | `CreateMessageDto` | Envoie un nouveau message. |
| `message.update` | `{ messageId: string; update: UpdateMessageDto }` | Edite un message. |
| `message.delete` | `{ messageId: string }` | Supprime un message. |
| `message.delivery.ack` | `{ messageId: string }` | Confirme la réception d’un message pour passer le statut `sent → delivered`. |
| `message.read` | `{ conversationId: string }` | Signale que la conversation est lue (`delivered → read`). |
| `typing.start` | `{ conversationId: string }` | Notifie que l’utilisateur commence à taper ; le serveur diffuse `user.typing` aux autres participants. |
| `typing.stop` | `{ conversationId: string }` | Notifie que l’utilisateur arrête de taper ; le serveur diffuse `user.typing` avec `isTyping: false`. |

> Tous les events nécessitent un utilisateur authentifié (token JWT / session). Le guard WebSocket ferme la connexion sinon.

## Évènements reçus du serveur

| Event | Payload | Description |
| --- | --- | --- |
| `message.new` | `MessageResponseDto` | Nouveau message reçu dans la conversation. Statut initial `sent`. |
| `message.updated` | `MessageResponseDto` | Mise à jour d’un message (statut, édition, suppression). |
| `message.deleted` | `MessageResponseDto` | Confirmation d’une suppression logicielle. |
| `message.read` | `{ conversationId: string; userId: string; unreadCount: number }` | Notification de lecture d’une conversation. |
| `user.typing` | `{ conversationId: string; userId: string; isTyping: boolean }` | Indique qu’un participant commence (`true`) ou arrête (`false`) de taper. |

## Notes d’intégration

- Les indicateurs de frappe expirent automatiquement côté backend après ~5 s pour éviter les états bloqués ; penser à renvoyer `typing.start` périodiquement tant que l’utilisateur tape.
- `message.delivery.ack` doit être émis dès que le message est affiché/réceptionné côté client, sinon il restera avec l’état `sent`.
- Pour éviter les doublons, garder une file locale de `messageId` / `conversationId` à rejouer en cas de reconnexion WebSocket.
