### **Backend Tandem — Architecture détaillée et guide de développement**

---

## **Choix techniques **

* **Langage / Runtime** : Node.js 22, TypeScript strict.
* **Framework** : NestJS (modulaire, REST + WebSocket).
* **ORM** : TypeORM (PostgreSQL).
* **Base de données** : PostgreSQL managé.
* **Cache / Queues / WS adapter** : Redis (BullMQ pour jobs).
* **Authentification** : **NestJS natif (JWT)**, access tokens courts + refresh rotation, bcryptjs pour le hachage des mots de passe.
* **Communication temps réel** : Socket.IO (namespaces + rooms).
* **API** : REST v1 + OpenAPI 3.1 généré automatiquement.
* **Observabilité** : OpenTelemetry (traces), Prometheus (metrics), Sentry (erreurs), Grafana (dashboards).
* **Notifications push** : FCM / APNs via worker dédié.
* **Emails transactionnels** : Resend (ou équivalent).
* **Sécurité périmétrique** : Cloudflare (TLS, WAF), CORS strict, Helmet.
* **Déploiement** : Docker, Railway / Fly.io (ou K8s selon budget), CI GitHub Actions.
* **Secrets** : Doppler (ou 1Password / Vault).
* **Feature flags** : table interne + env overrides.
* **Tests** : unitaires, intégration e2e (Nest), charge (k6).
* **Conformité** : RGPD, rétention limitée des messages, export / suppression compte.

---

## **1. Vision et périmètre**

* Application sociale : une seule conversation possible par jour.
* KPIs : taux d’activation jour 1, taux de réponse < 24 h, rétention D7.
* Contraintes : latence faible, expiration fiable des conversations, prévention du ghosting, respect éthique et confidentialité.

---

## **2. Architecture logique**

* **Modules NestJS** :
  auth | users | profiles | interests | values | availability | matching | conversation | messages | rewards | moderation | notifications | billing (V2) | admin | analytics.
* **Couches** :
  controller (REST / WS) → service (logique métier) → repository (TypeORM) → jobs (BullMQ) → guards/policies → mappers/DTO → adapters externes.
* **Temps réel** : Socket.IO (`/chat`), rooms par conversation, adapter Redis.
* **Observabilité** : instrumentation OpenTelemetry, métriques Prometheus, logs structurés JSON.

---

## **3. Modèle de données (vue conceptuelle)**

* **Utilisateur** : id OIDC, fuseau horaire, locale, statut, timestamps.
* **Profil** : prénom, âge, bio, ville, photo, préférences, visibilité.
* **Intérêts / valeurs** : référentiels + tables d’association utilisateur avec pondération.
* **Disponibilité** : état quotidien (idle / queued / matched), dernier heartbeat, index par date.
* **Match** : paire journalière, score d’affinité, état (pending / accepted / expired).
* **Conversation** : bornes temporelles (start, expires, extended), état (active / expired / closed).
* **Participants** : droits lecture/écriture, bornes individuelles.
* **Message** : auteur, timestamp, conversation, suppression TTL.
* **Récompenses / Streaks** : ledger append-only, calcul quotidien.
* **Signalements / Blocages** : reporter → reported, statut, cause.
* **Jetons push** : plateforme, token, dernière activité.
* **Abonnements (V2)** : plan, statut, renouvellement, id externe Stripe.
* **Analytics events** : nom, propriétés JSON, timestamp.
* **Audit log** : acteur, action, ressource, métadonnées.

---

## **4. Flux critiques à implémenter**

**Disponibilité**

* Activer la disponibilité du jour.
* Heartbeat présence (TTL Redis).
* Mise en file par timezone ± 2 h.

**Appariement**

* Job périodique : extraction du pool actif.
* Scoring (intérêts, valeurs, taux de réponse, pénalités ghost).
* Création atomique du match + conversation (transaction).
* Envoi push + événement WebSocket.

**Conversation 24 h**

* Auth WS pour participants.
* Envoi / réception / diffusion WS, persistance DB.
* Job d’expiration minutely.
* Prolongation par consentement mutuel (Premium V2).

**Anti-ghosting**

* Rappel automatique silence > 6 h.
* Suspension matchmaking après 3 abandons consécutifs.

**Récompenses**

* Attribution points selon engagement (réponse rapide, durée, série).
* Calcul streaks en batch quotidien.

**Modération**

* Signalement synchrone, scan asynchrone (heuristique + IA).
* Blocage bilatéral exclu du matching futur.

**Notifications**

* Push/email orchestrés par workers (retries idempotents).

---

## **5. Surface API (vue fonctionnelle)**

* **Auth** : échange OIDC → session, profil utilisateur.
* **Disponibilité** : activer / désactiver, état du jour.
* **Match** : récupération match courant, métadonnées pair.
* **Conversation** : lire / envoyer messages, statut, prolongation (V2).
* **Modération** : créer signalement, consulter statut.
* **Blocage** : créer / lister.
* **Récompenses** : consulter score, badges, séries.
* **Notifications** : enregistrer token push.
* **Santé / Observabilité** : healthz, metrics, version.
* **Billing (V2)** : plans, statut, webhooks.

---

## **6. Sécurité et accès**

* Auth obligatoire pour tout endpoint métier.
* Guards : contrôle de propriété, vérif scopes OIDC.
* Idempotence header pour actions sensibles.
* Rate-limit IP + user + device.
* Validation DTO stricte, sanitation inputs.
* CORS whitelisté, Helmet activé, HSTS proxy.
* Chiffrement TLS partout, données au repos dans PG managé.

---

## **7. Jobs / planification**

* Pairing : exécution 5–10 s, backoff pool vide.
* Expiration : job 1 min, batch, idempotent.
* Notifications : queue dédiée, retry exponentiel.
* Modération : queue SLA < 24 h.
* Rewards : batch fin de journée.
* Maintenance : purge TTL, compaction, archivage.

---

## **8. Observabilité / SLO**

* Traces : HTTP, DB, queues, WS.
* Métriques : latence p95, taux 5xx, jobs pending, messages / conversation, délais match.
* SLO : p95 API < 200 ms ; p95 matching < 30 s ; livraison WS < 200 ms.
* Alertes : erreurs, latence, file jobs, disponibilité Redis/DB.

---

## **9. Environnements / livrables**

* **Dev** : stack Docker locale, seed synthétique.
* **Staging** : miroir prod, anonymisation, e2e automatiques.
* **Prod** : API, workers, WS répliqués ; Postgres HA ; Redis HA ; proxy TLS.
* **Artefacts** : images Docker versionnées, OpenAPI, Grafana dashboards, runbooks incidents.

---

## **10. CI/CD / qualité**

* Pipeline : lint → type-check → unit → build → e2e → scan → image → staging → promotion prod.
* Déploiement progressif, healthchecks, rollback auto.
* Feature flags pour dark deploy.
* PR review obligatoire, changelog maintenu.

---

## **11. Données / migrations / rétention**

* Migrations TypeORM versionnées, roll-forward only.
* Backups PG automatiques (quotidien, hebdo, mensuel).
* Rétention : messages J+2 ; events 90 j ; disponibilités 7 j.
* Export/Suppression : endpoint user, délai grâce, purge logique/physique selon table.

---

## **12. Tests**

* Unitaires : matching, conversation, rewards, modération.
* Intégration : flux complet (disponibilité → match → chat → expiration → report).
* E2E : scénarios multi-utilisateurs réels.
* Charge : WS+HTTP, stress Redis/DB.
* Résilience : redémarrages workers, perte Redis, backpressure WS.

---

## **13. Sécurité / conformité**

* RGPD : minimisation données, consentements explicites, registre traitements.
* DPA fournisseur DB / mail / push.
* Audit log actions sensibles (extend, block, admin).
* Rotation secrets trimestrielle.
* Accès interne : least-privilege, IAM Cloud clair.

---

## **14. Phasage livraison**

* **Semaine 1–2** : scaffolding, auth OIDC, profils, disponibilité, WS base, OpenAPI, observabilité, CI.
* **Semaine 3–4** : matching simple, conversation TTL, messages, notifications, métriques.
* **Semaine 5–6** : anti-ghost, rewards, reports, blocks, admin light, purge.
* **Semaine 7–8** : sécurité, charge, dashboards, staging public, runbooks.
* **V1** : algorithme pondéré, push robuste, instrumentation complète.
* **V2** : billing + premium extend, modération IA, insights.
* **V3** : multi-régions, communautés, intégrations externes.

---

## **15. Critères de sortie par jalon**

* **Alpha** : disponibilité + match + premier message fonctionnels, expiration fiable.
* **Beta** : latence / erreurs dans SLO, instrumentation complète, anti-ghost stable.
* **V1** : stabilité 10 k utilisateurs, métriques saines.
* **V2** : monétisation et privacy validées.
* **V3** : scalabilité régionale, intégrations fonctionnelles.

---