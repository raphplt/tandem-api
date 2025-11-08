# Flux SSE de recherche de match quotidien

Ce document décrit le fonctionnement du nouvel endpoint SSE `/matches/search/stream`, ajouté pour afficher en temps réel l'état de la recherche quotidienne et informer le front dès qu'un match est trouvé.

## Objectifs produit

1. **Retour instantané** après l'action « Lancer ma rencontre » : l'utilisateur voit immédiatement qu'il est en file (`status=queued`).
2. **Attente pilotée par le backend** : pas de polling agressif, le backend pousse les changements d'état et le match final.
3. **Tolérance réseau** : keep-alive intégré (`heartbeat`) pour détecter les coupures et relancer la connexion si besoin.

## Endpoint

- **Route** : `GET /matches/search/stream`
- **Auth** : Bearer BetterAuth (même garde que les autres routes matches)
- **Headers** : `Accept: text/event-stream`
- **Retour** : flux SSE (event-stream) où chaque `data:` contient un objet JSON sérialisé
- **Déconnexion** : fermer l'EventSource côté client en quittant l'écran ou après réception d'un match

## Types d'événements

| Type | Payload | Déclencheur |
| --- | --- | --- |
| `search_state` | `{ status, queuedAt, timeInQueue, isOnline }` | À l'abonnement + après chaque update `AvailabilityService.setStatus` / `sendHeartbeat` |
| `match_found` | `{ match: MatchResponse }` | Lorsqu'un match quotidien (`MatchType.DAILY`) est créé pour l'utilisateur (job auto ou admin). Rejoué à l'ouverture si un match existe déjà. |
| `heartbeat` | `{ timestamp }` | Keep-alive toutes les 15 s pour garder la connexion ouverte et faciliter la détection de timeouts côté front. |

## Architecture backend

- `AvailabilityService` publie `availability.status.<userId>` via `EventEmitter2` dès qu'un statut est persisté (join/leave queue, heartbeat, matched…).
- `MatchesService` publie `matches.found.<userId>` quand un match `daily` est créé (`create` manuel ou `generateDailyMatches`).
- `MatchSearchStreamService` (Nest) agrège ces événements en `Observable<MessageEvent>` : il renvoie l'état initial (disponibilité + match éventuel), s'abonne aux events, et injecte le `heartbeat`.
- `MatchesController` expose `@Sse('search/stream')` et renvoie simplement l'observable du service.

## Intégration front (Expo / React Native)

```ts
import { useEffect, useRef } from 'react';

export function useDailyMatchStream(token: string, onMatch: (match) => void) {
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource('https://api.wetwo.app/matches/search/stream', {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    } as any); // expo-eventsource polyfill

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === 'search_state') {
        // mettre à jour UI « En attente… »
      }

      if (payload.type === 'match_found') {
        onMatch(payload.match);
      }
    };

    source.onerror = () => {
      source.close();
      // Optionnel: retry avec backoff
    };

    sourceRef.current = source;
    return () => source.close();
  }, [token, onMatch]);

  return { close: () => sourceRef.current?.close() };
}
```

> Penser à lancer `POST /availability/queue/join` avant d'ouvrir le flux et à envoyer un heartbeat périodique (`POST /availability/heartbeat`) pour rester `isOnline=true`.

## Cas limites

- **Quota quotidien déjà atteint** : l'événement initial `search_state` sera `status='idle'` et un `match_found` peut arriver instantanément si le match existe déjà.
- **Perte de session / token expiré** : l'EventSource passe en erreur (`401`). Fermer la connexion, rafraîchir le token via BetterAuth, puis rouvrir.
- **Timeout > 60 min** : côté produit, `AvailabilityService` peut exposer plus tard un event `search_timeout`; pour l'instant, c'est géré côté front (timer local + option pour quitter la file).

## Checklist QA

- ☐ Lancer `queue/join`, ouvrir l'EventSource, vérifier la réception d'au moins un `search_state`.
- ☐ Forcer la création d'un match (script ou job) et vérifier la réception de `match_found`.
- ☐ Couper le réseau > 30 s : l'EventSource doit se reconnecter automatiquement, sinon retenter manuellement.
- ☐ Vérifier que les heartbeats (`POST /availability/heartbeat`) maintiennent `isOnline` à `true` pour un affichage cohérent.
