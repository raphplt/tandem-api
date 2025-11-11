# Intégration front : accusés de réception type WhatsApp

Ces notes couvrent ce qu'il reste à implémenter côté Expo/React Native pour exploiter le nouveau système de statuts (`sent → delivered → read`). La logique WebSocket et conversationnelle existe déjà, il s'agit surtout de réagir aux bons événements et d'envoyer les confirmations.

## 1. Cartographie API

| Action | Transport | Détails |
| --- | --- | --- |
| Confirmer la réception d'un message | REST | `POST /messages/:messageId/acknowledge` (auth requis, pas de body) |
| Confirmer la réception d'un message | WebSocket | Émettre `message.delivery.ack` avec `{ messageId }` |
| Recevoir un nouveau message | WebSocket | Événement `message.new` → payload `MessageResponseDto` (status initial `sent`) |
| Recevoir une mise à jour de statut/contenu | WebSocket | Événement `message.updated` |
| Marquer une conversation comme lue | WebSocket déjà présent | Émettre `message.read` avec `{ conversationId }` |

👉 Utiliser le canal WebSocket par défaut (`/chat`). Le REST est là en fallback (utile si la socket tombe ou pour rejouer les acks en arrière-plan).

## 2. Workflow côté client

1. **À la connexion / reprise d'une conversation**
   - Joindre la room via `conversation.join`.
   - Récupérer l'historique (endpoint REST existant) pour hydrater la liste avec les statuts stockés côté backend (`sent/delivered/read`).

2. **À la réception d'un `message.new`**
   - Afficher le message avec son statut initial `sent`.
   - Dès que le message est rendu (ou stocké localement), envoyer un accusé :
     ```ts
     socket.emit('message.delivery.ack', { messageId });
     ```
     - Prévoir un retry (ex. queue en mémoire + flush lorsque la socket redevient `connected`).
     - En offline, stocker les `messageId` en attente et jouer les acks soit via REST (`POST /messages/:id/acknowledge`), soit dès la reconnexion WebSocket.

3. **Réception d'un `message.updated`**
   - Ce flux est déclenché quand le backend passe un message à `delivered`, `read`, quand il est édité ou supprimé.
   - Mettre à jour l'entrée correspondante dans le store local (Redux/Zustand/Query, selon ton app RN).

4. **Confirmation de lecture**
   - Comportement existant : quand l'utilisateur ouvre la conversation, émettre `message.read` avec `{ conversationId }`.
   - Sur `message.read` côté écouteur, mettre à jour l'état « double check bleu » pour les messages dont l'auteur est l'utilisateur courant.

## 3. UI/UX recommandée

- **Indicateurs de statut style WhatsApp**
  - `sent`: un seul check gris (message envoyé mais pas encore reçu par l'autre).
  - `delivered`: double check gris (le destinataire a renvoyé un ack).
  - `read`: double check bleu (événement `message.read` reçu).
- Mettre les icônes côté auteur uniquement.
- Actualiser en temps réel via `message.updated` / `message.read`.

## 4. Gestion des déconnexions

- **Queue d’acks** : conserver en mémoire (ou storage sécurisé) les IDs des messages non confirmés.
- **Reconnexion socket** :
  1. Relancer `conversation.join` pour chaque conversation ouverte.
  2. Rejouer les `message.delivery.ack` en attente (ou les endpoints REST).
  3. Rafraîchir la liste via appel REST pour être certain de l’état des statuts si la session est longue.

## 5. Tests fonctionnels à prévoir

1. Deux utilisateurs connectés : vérifier la transition `sent → delivered` dès que le second rend le message.
2. Déconnexion du destinataire : envoyer un message, reconnecter et vérifier que l’ack en attente est bien renvoyé puis que le statut passe à `delivered`.
3. Lecture de conversation : confirmer que `message.read` passe bien les messages de l’expéditeur aux double checks bleus.

En implémentant les points ci-dessus, l’expérience se rapprochera du comportement attendu façon WhatsApp tout en restantsynchronisée avec la logique backend.
