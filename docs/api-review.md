# Revue API Wetwo (2025-11-02)

## 1. Synthèse rapide

- Les blocs Auth, Users, Profiles, Availability, Messages, Matches et Conversations contiennent déjà une logique métier conséquente et cohérente.
- Une large partie du périmètre reste à implémenter : Analytics, Admin, Notifications, Push Tokens, Reports, Rewards, et plusieurs DTOs/Entities ne sont que des coquilles.
- Les contrôles d'accès sont très inégaux : plusieurs contrôleurs REST critiques restent exposés sans garde ni rôles.
- La protection périmétrique (secret par défaut, rate limiting absent, Swagger public) est à fiabiliser avant toute mise en ligne.
- La base de tests couvre surtout Availability/Users/Auth/Values/Interests ; le cœur temps réel (Messages, Conversations, Matches) n'a aucun test automatisé.

## 2. Sécurité

- [HAUT] `src/matches/matches.controller.ts`, `src/conversations/conversations.controller.ts`, `src/analytics/analytics.controller.ts`, `src/notifications/notifications.controller.ts`, `src/rewards/rewards.controller.ts`, `src/reports/reports.controller.ts`, `src/push-tokens/push-tokens.controller.ts` exposent des CRUD complets sans `@UseGuards(AuthGuard)` ni rôles, donc accessibles publiquement.
- [HAUT] `src/auth/better-auth.service.ts` charge un secret par défaut (`"change-me-in-production"`) si la variable d'environnement est absente, ce qui rend toutes les sessions forgeables en prod.
- [MOYEN] `ThrottlerModule` est configuré mais jamais activé via `APP_GUARD` (`src/app.module.ts`), donc aucun rate limit effectif.
- [MOYEN] Swagger est servi sur `/api/docs` sans authentication (`src/main.ts`), fuite de surface d'API et des schémas.
- [MOYEN] `MessagesController.findAll` (`src/messages/messages.controller.ts`) renvoie tous les messages aux utilisateurs connectés, sans filtre ni rôle.
- [FAIBLE] `AuthService.getProfile` laisse un `console.log('Session', ...)` (`src/auth/auth.service.ts`) qui divulgue potentiellement des jetons en log.

## 3. Authentification & Autorisations

- `AuthGuard` et `WsAuthGuard` fonctionnent correctement mais seuls les modules qui les déclarent explicitement sont protégés.
- `UsersController.create` est public (`@Public`) et duplique l'inscription `auth/register`, prévoir de la limiter ou de la supprimer (`src/users/users.controller.ts`).
- `OwnershipGuard` ne protège que les routes avec `:id` ou `:userId`; les routes utilisant `:conversationId`, `:matchId`, etc. restent non couvertes.
- Les WebSockets rejoignent bien des rooms spécifiques, mais aucune vérification de rôle sur les événements sensibles (ex : suppression de message) n'est présente (`src/messages/messages.gateway.ts`).
- Pas de mécanisme de gestion d'expiration/rafraîchissement d'access token exposé côté API (seul `better-auth` côté service).

## 4. Robustesse & Qualité technique

- `ProfilesService.findNearbyProfiles` (`src/profiles/profiles.service.ts`) utilise `ST_Point` sur un champ JSON sans cast -> requête Postgres invalide sans PostGIS + types numériques.
- `AvailabilityService.sendHeartbeat` n'actualise `metadata.lastActivity` que si un metadata custom est fourni, ce qui bloque la détection d'activité (`src/availability/availability.service.ts`).
- Les endpoints `ParseIntPipe` optionnels (`src/values/values.controller.ts`, `src/interests/interests.controller.ts`, `src/availability/availability.controller.ts`) lèvent une 400 dès que le query param `limit` est absent.
- `MessagesService.findAll` / `MatchesService.findAll` / `ConversationsService.findAll` chargent l'intégralité des enregistrements sans pagination ni filtre (`src/messages/messages.service.ts`, `src/matches/matches.service.ts`, `src/conversations/conversations.service.ts`).
- `MatchesService.generateDailyMatches` effectue des requêtes imbriquées pour chaque paire (O(n²) + I/O DB) et calculs approximatifs (`src/matches/matches.service.ts`).

## 5. Clarté & Maintenabilité

- Le style est globalement homogène (ESLint + Prettier), mais beaucoup de fichiers générés (controllers/services) restent en anglais vs. doc en français.
- Plusieurs TODOs ou remarques (ex `// TODO : à améliorer`) jalonnent `ProfilesService` et `MatchesService` sans backlog associé.
- Les entités `analytics.entity.ts`, `notification.entity.ts`, `admin.entity.ts`, etc., sont vides ; mieux vaut les supprimer tant que non implémentées pour éviter de la confusion.
- `TypeORMAdapter` (`src/auth/typeorm-adapter.ts`) contient un mapping complexe sans tests unitaires => maintenance délicate si Better Auth évolue.

## 6. Documentation & Observabilité

- Documentation écrite limitée à `docs/agent.md`; pas de README technique, de séquence d'initialisation, ni de `CONTRIBUTING`.
- Swagger généré automatiquement mais non restreint ; aucune doc complémentaire (exemples de payloads réalistes, conventions d'erreurs).
- Observabilité : instrumentation promise (OpenTelemetry, Prometheus, Sentry) mais aucune initialisation concrète hormis `Sentry.init` dans `main.ts` (pas de métriques ou traces).
- Aucun guide d'exploitation (healthchecks, runbooks) ni description des dashboards pourtant cités dans la spec.

## 7. Tests & Qualité

- Bon pack de tests unitaires sur Availability, Users, Auth, Interests, Values (voir `src/.../*.spec.ts`).
- Aucune couverture pour `messages`, `matches`, `conversations`, `profiles`, `push-tokens`, `notifications`, `rewards`, etc.
- Pas de tests e2e ni d'intégration pour le flux critique disponibilité → match → conversation → message.
- CI/CD non défini (pas de workflow GitHub Actions, pas de rapport de couverture exploité).
- Les tests générés pour les contrôleurs Availability sont pertinents mais mockent tout; prévoir des tests d'intégration réels sur la stack Nest + DB.

## 8. Couverture fonctionnelle

| Module                                                                | Etat        | Commentaire                                                                    |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| Auth, Users, Profiles, Availability, Messages, Matches, Conversations | Avancé      | Logique métier complète mais encore des finitions (autorisation, perf, tests). |
| Interests, Values                                                     | Solide      | CRUD riche + stats, tests présents.                                            |
| Analytics, Admin, Notifications, Rewards, Push Tokens, Reports        | Coquilles   | Services/controllers retour "This action..." sans implémentation.              |
| Database seed/migrations                                              | A compléter | `src/database/seed.ts` rudimentaire, aucun script de migration fourni.         |
| Observabilité & jobs                                                  | Partiel     | Déclarations (Bull, Schedule) mais aucun worker concret dans le repo.          |

Estimation grossière : ~45% du périmètre V1 décrit dans `docs/agent.md` est implémenté, ~20% en chantier, ~35% inexistant.

## 9. Pistes prioritaires

1. Sécuriser immédiatement les contrôleurs non gardés et forcer la configuration du secret Better Auth avant tout déploiement.
2. Finaliser les modules critiques (Notifications, Push Tokens, Rewards, Analytics) ou les retirer du bundle tant qu'ils sont vides.
3. Couvrir le flux matchmaking → conversation → message par des tests d'intégration avec une base Postgres réelle et ajouter de la pagination sur les listes.
