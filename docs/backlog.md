# Backlog Flint API (priorisé)

## P0 — Bloquants immédiats

- [x] Sécuriser tous les contrôleurs REST sans garde (`matches`, `conversations`, `analytics`, `notifications`, `rewards`, `reports`, `push-tokens`) en appliquant `@UseGuards(AuthGuard)` et rôles adaptés.
- [x] Forcer la configuration du secret Better Auth (`AUTH_SECRET`) et refuser le fallback "change-me-in-production" en production.
- [x] Activer réellement le rate limiting global en ajoutant `ThrottlerGuard` comme `APP_GUARD`.
- [x] Protéger l'accès Swagger `/api/docs` (auth basique ou désactivation hors dev).
- [x] Retirer le `console.log` de session dans `AuthService.getProfile`.
- [x] Corriger `MessagesController.findAll` pour empêcher l'accès massif aux messages (pagination + ownership + scopes).

## P1 — Sécurité & Auth (court terme)

- [x] Restreindre `UsersController.create` aux administrateurs pour éviter la double inscription côté API et laisser Better Auth gérer l'enrôlement public.
- [x] Étendre `OwnershipGuard`/règles d'accès aux routes identifiées par `conversationId`, `matchId`, `messageId`, etc.
- [x] Ajouter des règles métiers côté WebSocket (ex: seuls les participants peuvent supprimer/éditer un message).
- [x] Exposer un flux de refresh/rotation des tokens côté API si nécessaire (alignement avec Better Auth). (faire attention à ne pas faire n'importe quoi, pour info on utiliser better auth et la stratégie BearerToken)

## P1 — Robustesse & Qualité technique

- [ ] Corriger `ProfilesService.findNearbyProfiles` (utiliser types géo valides ou champs PostGIS dédiés).
- [ ] Mettre à jour `AvailabilityService.sendHeartbeat` pour toujours rafraîchir `metadata.lastActivity`.
- [ ] Rendre optionnels les `ParseIntPipe` (utiliser `ParseIntPipe({ optional: true })` ou parsing custom) sur les contrôleurs `values`, `interests`, `availability`.
- [ ] Ajouter pagination/filtrage aux endpoints listant messages, matches, conversations.
- [ ] Optimiser `MatchesService.generateDailyMatches` (batch DB + scoring hors requêtes imbriquées).

## P1 — Tests & Qualité

- [ ] Couvrir par tests unitaires/services : `messages`, `matches`, `conversations`, `profiles`.
- [ ] Écrire tests d'intégration/e2e pour le flux disponibilité → match → conversation → message (Postgres + Redis réel ou conteneurs).
- [ ] Mettre en place une CI de base (lint, test, build) via GitHub Actions.

## P2 — Fonctionnalités manquantes

- [ ] Implémenter réellement les modules `notifications`, `push-tokens`, `rewards`, `reports`, `analytics`, `admin` (services, repositories, DTOs, guards, tests).
- [ ] Compléter les workers Bull / planification (matching périodique, expiration conversation, notifications, rewards).
- [ ] Finaliser la couche observabilité : métriques Prometheus, traces OpenTelemetry, logs structurés.
- [ ] Ajouter migrations TypeORM et scripts de bootstrap base données.
- [ ] Étendre seeders pour données synthétiques cohérentes (utilisateurs, profils, valeurs, intérêts).

## P2 — Documentation & DX

- [ ] Créer un README technique (prérequis, installation, commandes, env vars).
- [ ] Documenter les conventions d'API (erreurs, pagination, exemples payloads) et compléter la doc Swagger.
- [ ] Ajouter un guide d'exploitation (healthchecks, alerting, runbooks).
- [ ] Mettre à jour `docs/agent.md` avec l'état d'avancement réel ou déplacer la vision produit dans un doc dédié.

## P3 — Améliorations futures

- [ ] Introduire pagination cursor-based pour les conversations/messages.
- [ ] Implémenter mécanismes d'anti-ghosting (rappels 6h) et suspensions matchmaking.
- [ ] Formaliser un système de feature flags (DB + overrides env).
- [ ] Préparer le support multi-environnements (staging/prod) avec configuration différenciée.
- [ ] Étudier l'intégration des jobs de calcul de rewards/streaks en batch et le reporting analytics avancé.
