# Architecture Flint API

## Schéma de base de données

- **users** : `id` uuid, `email`/`phone`/`apple_sub`/`google_sub` uniques et optionnels, `password` hash nullable, `roles` text[] (défaut `[user]`), `is_active`, `last_login_at`, `last_logout_at`, `onboarded_at`, timestamps ; relations 1‑1 `profiles`/`profile_preferences`, 1‑n `user_auth_methods`/`sessions`/`photos`/`verifications`/`audit_logs`. (`src/users/entities/user.entity.ts:21`)
- **user_auth_methods** : uuid, FK `user_id` (CASCADE), enum `type` {apple, google, phone, email}, `identifier` indexé, bool `is_primary`, `last_used_at`, timestamps. (`src/users/entities/user-auth-method.entity.ts:19`)
- **sessions** : uuid, FK `user_id`, `device_id`, `refresh_token_hash`, `expires_at` timestamptz, `created_at`. (`src/users/entities/session.entity.ts:10`)
- **photos** : uuid, FK `user_id`, `url`, `position`, bool `is_active`, timestamps. (`src/users/entities/photo.entity.ts:11`)
- **verifications** : uuid, FK `user_id`, enum `type` {selfie}, enum `status` {pending, approved, rejected}, `reviewed_at`, timestamps. (`src/users/entities/verification.entity.ts:21`)
- **audit_logs** : uuid, FK `actor_user_id` (SET NULL), `action`, `meta_json` jsonb, `created_at`. (`src/users/entities/audit-log.entity.ts:11`)
- **profiles** : uuid + FK `user_id`, identité (nom, âge, bio), localisation (`lat`,`lng`,`city`,`country`), préférences jsonb (tranche d’âge, distance, intérêts, valeurs), `social_links`, `visibility`, compteurs (`view_count`,`like_count`,`match_count`), flags `is_complete`,`is_verified`,`is_active`, timestamps, relations ManyToMany vers `interests` et `values`. (`src/profiles/entities/profile.entity.ts:29`)
- **profile_preferences** : uuid, FK unique `user_id`, paramètres `age_min/max`, `distance_km`, timestamps. (`src/profiles/entities/profile-preference.entity.ts:12`)
- **profile_interests / profile_values** : tables pivot créées par TypeORM avec colonnes `profile_id` et `interest_id` ou `value_id`, FKs en cascade. (`src/interests/entities/interest.entity.ts:66`, `src/values/entities/value.entity.ts:66`)
- **interests** : uuid, `name` unique, `category` enum, attributs d’affichage (`description`, `icon`, `color`), flag `is_active`, compteurs, `tags` text[], `metadata` jsonb, timestamps. (`src/interests/entities/interest.entity.ts:28`)
- **values** : structure équivalente avec enum `ValueCategory` et `metadata` enrichi. (`src/values/entities/value.entity.ts:27`)
- **availability** : uuid, FK `user_id`, enum `status` {idle, queued, matched, busy, offline}, `date`, marqueurs temps (`last_heartbeat`, `queued_at`, …), bool `is_active`/`is_available`, `preferences` jsonb (timezone, autoMatch…), `metadata` jsonb (device/location/network), timestamps. (`src/availability/entities/availability.entity.ts:21`)
- **matches** : uuid, FKs `user1_id`/`user2_id` + `profile1_id`/`profile2_id`, enum `status` {pending, accepted, rejected, expired, cancelled}, enum `type` {daily, manual, premium}, `compatibility_score` decimal, `scoring_breakdown` jsonb, `match_date`, événements (`expires_at`,`accepted_at`,`rejected_at`,`cancelled_at`,`expired_at`), bool `is_active`/`is_mutual`, `metadata` jsonb, timestamps. (`src/matches/entities/match.entity.ts:28`)
- **conversations** : uuid, FKs `user1_id`/`user2_id` et `match_id`, enum `status` {active, expired, closed, archived}, enum `type` {daily, extended, premium}, `start_time`, `expires_at`, marqueurs `extended_at`/`closed_at`/`archived_at`, flags `is_read_by_user1/2`, `last_message_at`, `message_count`, `metadata` jsonb (last_seen, extensions…), timestamps. (`src/conversations/entities/conversation.entity.ts:29`)
- **messages** : uuid, FKs `author_id`, `conversation_id`, `content`, enum `type` {text, image, emoji, system}, enum `status` {sent, delivered, read, failed}, `reply_to_id`, `edited_at`, `deleted_at`, bool `is_deleted`/`is_edited`, `metadata` jsonb (fichiers, emoji, tentatives livraison), timestamps. (`src/messages/entities/message.entity.ts:28`)
- **onboarding_drafts** : uuid, `device_id` unique, `payload_json` jsonb, `token_hash`, `expires_at`, timestamps. (`src/onboarding/entities/onboarding-draft.entity.ts:10`)
- **better_auth_user** : uuid aligné sur l’ID BetterAuth, `email` unique, `name`, `image`, bool `email_verified`, timestamps. (`src/auth/entities/better-auth-user.entity.ts:10`)
- **better_auth_account** : uuid, FK `user_id`, `account_id`, `provider_id`, tokens (`access_token`, `refresh_token`, `id_token`, expirations), `scope`, `password`, timestamps. (`src/auth/entities/better-auth-account.entity.ts:10`)
- **better_auth_session** : uuid, FK `user_id`, `token` indexé, `expires_at`, `ip_address`, `user_agent`, timestamps. (`src/auth/entities/better-auth-session.entity.ts:10`)

## Authentification

- Flux email/mot de passe assurés par BetterAuth ; `AuthService.register` et `login` délèguent la création/validation au SDK, puis synchronisent un enregistrement `users` local via `ensureLocalUser`. (`src/auth/auth.service.ts:27`, `src/auth/auth.service.ts:182`)
- Les métadonnées applicatives (nom, rôles, timestamps) sont mises à jour à chaque connexion ou rafraîchissement (`updateUserLastLogin`, `refreshSession`). (`src/auth/auth.service.ts:174`, `src/auth/auth.service.ts:151`)
- `BetterAuthService` instancie BetterAuth avec l’adaptateur TypeORM et le plugin bearer-only, configure la durée des sessions et les origins autorisées, et expose `getSession`/`refreshSession` qui traduisent automatiquement les headers Express. (`src/auth/better-auth.service.ts:25`, `src/auth/better-auth.service.ts:86`)
- Les tables `better_auth_*` stockent l’identité et les sessions techniques tandis que `users` porte les règles métiers (rôles, onboarding, préférences), découplant infrastructure d’auth et logique produit.
- Des guards globaux (`AuthGuard`, `RolesGuard`) sont enregistrés dans `AppModule` pour appliquer l’auth et les permissions NestJS au niveau de toutes les routes. (`src/app.module.ts:107`)

## Système de matching

- `MatchesService.create` vérifie l’existence des utilisateurs/profils, l’unicité du couple et la limite quotidienne (1 match par jour) avant toute insertion. (`src/matches/matches.service.ts:41`)
- Le score de compatibilité (calculé si absent) pondère âge, localisation, intérêts, valeurs, activité, taux de réponse et vérification ; seuil minimum 60/100 pour créer un match. (`src/matches/matches.service.ts:59`, `src/matches/matches.service.ts:124`)
- Les actions accept/reject/cancel contrôlent que l’appelant est l’un des participants, puis historisent l’événement via les colonnes temporelles et le `MatchStatus`. (`src/matches/matches.service.ts:183`, `src/matches/matches.service.ts:212`)
- `generateDailyMatches` applique un algorithme greedy : parcours des profils actifs complets (`profiles.isComplete`), calcul du score puis création d’un match si le seuil est atteint, en annotant le `metadata.matchingAlgorithm`. (`src/matches/matches.service.ts:257`)
- La table `availability` sert à suivre le statut temps réel (idle / queued / matched / busy / offline) et stocke préférences et métadonnées de session pour orchestrer les paires quotidiennes. (`src/availability/entities/availability.entity.ts:21`)

## Système de messagerie

- Une conversation naît d’un match accepté : `ConversationsService.create` vérifie l’état du match, l’absence de conversation existante et initialise la fenêtre temporelle (24 h par défaut). (`src/conversations/conversations.service.ts:36`)
- Les conversations peuvent être prolongées jusqu’à trois fois (+24 h chacune), clôturées ou archivées ; chaque opération revalide l’appartenance de l’utilisateur et met à jour `metadata` (extensionCount, lastActivity, userXLastSeen). (`src/conversations/conversations.service.ts:185`, `src/conversations/conversations.service.ts:239`, `src/conversations/conversations.service.ts:274`)
- Les messages sont soumis à des validations strictes : appartenance à la conversation, statut actif, taille maximale, contraintes par type (URL pour image, emoji obligatoire…), délai d’édition de 5 min, soft delete qui masque le contenu. (`src/messages/messages.service.ts:40`, `src/messages/messages.service.ts:153`, `src/messages/messages.service.ts:212`)
- Chaque mutation émet un événement (`MESSAGE_CREATED/UPDATED/DELETED/READ`) via EventEmitter2 pour alimenter le gateway temps réel et mettre à jour `message_count`, `is_read_by_userX` et `last_message_at`. (`src/messages/messages.service.ts:93`, `src/messages/messages.service.ts:295`)
- Des utilitaires complètent le module : recherche (`ILIKE`), comptage des non-lus global ou par conversation, marquage delivered/read, nettoyage des messages de plus de deux jours (`cleanupExpiredMessages`). (`src/messages/messages.service.ts:352`, `src/messages/messages.service.ts:389`)

## Prochaines étapes suggérées

1. Générer ou actualiser les migrations TypeORM pour refléter exactement ce schéma (inclure les tables pivot et les colonnes JSONB).
2. Documenter l’intégration temps réel (MessagesGateway, notifications push) pour compléter la vue messagerie.
