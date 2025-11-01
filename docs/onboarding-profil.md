### API Update Tandem (Profil / Onboarding V1)

**Objectif :**
Mettre à jour l’API NestJS pour supporter l’onboarding et la création de profil minimaliste de l’app Tandem.
Adapter les entités `User`, `Profile`, `Interest` et leurs endpoints CRUD.

---

### **Contexte technique**

- Stack : NestJS v11, TypeORM, PostgreSQL, Redis, Better Auth, class-validator, Swagger.
- API prefix : `/api/v1`
- Modules existants : `Auth`, `Users`, `Profiles`, `Interests`, `Matches`.

---

### **Tâches à exécuter**

#### 1. **Entité `User`**

- Champs à conserver : `id`, `email`, `password`, `createdAt`, `updatedAt`.

- Relation : `@OneToOne(() => Profile, profile => profile.user, { cascade: true })`

#### 2. **Entité `Profile`**

- Eentité reliée à `User`.
- Champs :

  ```ts
  id: string;
  bio?: string;
  avatarUrl?: string;
  interests: Interest[];
  createdAt: Date;
  updatedAt: Date;
  ```
  (et tout autre champ que tu juge nécessaire)

- Relation :

  ```ts
  @OneToMany(() => Interest, i => i.profile, { cascade: true })
  @OneToOne(() => User, u => u.profile)
  ```

#### 3. **Entité `Interest`**

- Champs :

  ```ts
  id: string;
  label: string;
  profile: Profile;
  ```

- Relation : `@ManyToOne(() => Profile, p => p.interests, { onDelete: 'CASCADE' })`
- Prévoir un `InterestService` pour gérer la création/réutilisation d’intérêts communs.

---

#### 4. **CRUD / Endpoints**

##### `/profiles` (secured)

- `POST /profiles` → crée ou met à jour le profil de l’utilisateur connecté.

  ```json
  {
    "firstName": "Alex",
    "age": 22,
    "bio": "Ce qui me rend curieux…",
    "avatarUrl": "https://...",
    "interests": ["Musique", "Lecture", "Voyage"]
  }
  ```

  - Gère la création automatique d’intérêts si inexistants.
  - Lie le profil à `userId`.

- `GET /profiles/me` → renvoie profil utilisateur connecté.

- `PATCH /profiles/me` → met à jour.

- `DELETE /profiles/me` → supprime profil et intérêts liés.

##### `/interests`

- `GET /interests` → liste des intérêts populaires (distinct labels, count).
- `POST /interests` → création manuelle (admin-only).

---

#### 5. **Validation / DTOs**

- Validation avec `class-validator` :

  ```ts
  @IsString() firstName
  @IsInt() age
  @IsArray() @ArrayMinSize(3) @ArrayMaxSize(5) interests
  @IsOptional() @IsString() bio
  @IsOptional() @IsUrl() avatarUrl
  ```

---

#### 6. **Swagger**

- Mettre à jour la doc sur `/api/docs` :
  - Section `Profiles`
  - Exemple de payload complet.

---

#### 7. **Tests**

- Ajouter tests e2e pour :
  - Création profil complet.
  - Mise à jour profil.
  - Suppression (cascade Interests).

---

#### **Résultat attendu**

API prête pour intégration front :

- Création de profil complète via `/profiles`.
- Données cohérentes entre `User`, `Profile`, `Interest`.
- Validation stricte, Swagger à jour, tests OK.

---

Souhaites-tu que je t’en fasse une **version JSON compacte** pour ton agent IA (type `{ "goal": ..., "actions": [...] }`) ?
