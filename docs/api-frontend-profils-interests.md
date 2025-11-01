# Documentation API - Profils et Intérêts (Frontend)

**Version:** 1.0  
**Date:** 2024  
**Base URL:** `/api/v1`

---

## 🔐 Authentification

Tous les endpoints nécessitent une authentification via **Bearer Token**.

### Header requis
```
Authorization: Bearer <token>
```

Le token est obtenu via l'endpoint de connexion (`/auth/login`).

---

## 📋 Table des matières

1. [Profils](#profils)
2. [Intérêts](#intérêts)
3. [Entités TypeScript](#entités-typescript)
4. [Enums](#enums)

---

## 👤 Profils

### Base URL
```
/api/v1/profiles
```

---

### `POST /profiles`
Créer un nouveau profil pour l'utilisateur connecté.

**Authentification:** ✅ Requise  
**Body:**

```typescript
{
  bio: string;                    // 10-500 caractères (requis)
  city: string;                   // 2-100 caractères (requis)
  country?: string;               // 2-100 caractères (optionnel)
  age: number;                    // 18-100 (requis)
  gender: Gender;                 // Enum (requis)
  interestedIn: Gender[];         // Array d'enums (requis, minimum 1)
  photoUrl?: string;              // URL valide (optionnel)
  visibility?: ProfileVisibility; // Enum, défaut: PUBLIC (optionnel)
  preferences?: {
    ageRange?: { min: number; max: number };
    maxDistance?: number;         // 1-1000 km
    interests?: string[];        // Liste de noms d'intérêts (strings)
    values?: string[];
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
}
```

**Exemple:**
```json
{
  "bio": "Passionné de randonnée et de lecture",
  "city": "Paris",
  "country": "France",
  "age": 28,
  "gender": "male",
  "interestedIn": ["female", "non_binary"],
  "photoUrl": "https://example.com/photo.jpg",
  "visibility": "public",
  "preferences": {
    "ageRange": { "min": 22, "max": 35 },
    "maxDistance": 50,
    "interests": ["Randonnée", "Lecture", "Voyage"]
  },
  "location": {
    "latitude": 48.8566,
    "longitude": 2.3522,
    "city": "Paris",
    "country": "France"
  }
}
```

**Réponse (201):**
```typescript
ProfileResponseDto
```

**Erreurs possibles:**
- `400` - Données invalides
- `409` - Le profil existe déjà pour cet utilisateur

---

### `GET /profiles/my`
Récupérer le profil de l'utilisateur connecté.

**Authentification:** ✅ Requise

**Réponse (200):**
```typescript
ProfileResponseDto | null
```

**Erreurs possibles:**
- `404` - Profil non trouvé

---

### `GET /profiles/:id`
Récupérer un profil par ID.

**Authentification:** ✅ Requise  
**Note:** L'OwnershipGuard vérifie que vous ne pouvez accéder qu'à votre propre profil.

**Réponse (200):**
```typescript
ProfileResponseDto
```

**Erreurs possibles:**
- `404` - Profil non trouvé
- `403` - Accès interdit (pas votre profil)

---

### `PATCH /profiles/:id`
Mettre à jour un profil.

**Authentification:** ✅ Requise  
**Note:** L'OwnershipGuard vérifie que vous ne pouvez modifier que votre propre profil.

**Body:**
```typescript
UpdateProfileDto // Tous les champs du CreateProfileDto sont optionnels
```

**Exemple:**
```json
{
  "bio": "Nouvelle bio mise à jour",
  "age": 29
}
```

**Réponse (200):**
```typescript
ProfileResponseDto
```

**Erreurs possibles:**
- `400` - Données invalides
- `404` - Profil non trouvé
- `403` - Accès interdit (pas votre profil)

---

### `DELETE /profiles/:id`
Supprimer un profil (soft delete - désactive le profil).

**Authentification:** ✅ Requise  
**Note:** L'OwnershipGuard vérifie que vous ne pouvez supprimer que votre propre profil.

**Réponse (204):** Pas de contenu

**Erreurs possibles:**
- `404` - Profil non trouvé
- `403` - Accès interdit (pas votre profil)

---

### `GET /profiles/search`
Rechercher des profils avec filtres.

**Authentification:** ✅ Requise

**Query Parameters:**
- `q?: string` - Terme de recherche (bio, ville)
- `gender?: Gender` - Filtre par genre
- `minAge?: number` - Âge minimum
- `maxAge?: number` - Âge maximum
- `city?: string` - Filtre par ville
- `limit?: number` - Nombre de résultats (défaut: 20)

**Exemple:**
```
GET /profiles/search?q=randonnée&gender=female&minAge=25&maxAge=35&limit=10
```

**Réponse (200):**
```typescript
ProfileResponseDto[]
```

---

### `GET /profiles/nearby`
Trouver les profils à proximité.

**Authentification:** ✅ Requise

**Query Parameters:**
- `latitude: number` - Latitude (requis)
- `longitude: number` - Longitude (requis)
- `maxDistance: number` - Distance maximale en km (requis)
- `limit?: number` - Nombre de résultats (défaut: 20)

**Exemple:**
```
GET /profiles/nearby?latitude=48.8566&longitude=2.3522&maxDistance=25&limit=20
```

**Réponse (200):**
```typescript
ProfileResponseDto[]
```

---

### `GET /profiles`
Récupérer tous les profils actifs.

**Authentification:** ✅ Requise

**Réponse (200):**
```typescript
ProfileResponseDto[]
```

---

## 🎯 Intérêts

### Base URL
```
/api/v1/interests
```

---

### `GET /interests`
Récupérer tous les intérêts actifs, triés par popularité.

**Authentification:** ✅ Requise

**Réponse (200):**
```typescript
InterestResponseDto[]
```

---

### `GET /interests/popular?limit=10`
Récupérer les intérêts les plus populaires.

**Authentification:** ✅ Requise

**Query Parameters:**
- `limit?: number` - Nombre de résultats (défaut: 10)

**Réponse (200):**
```typescript
InterestResponseDto[]
```

---

### `GET /interests/trending?limit=10`
Récupérer les intérêts tendance (popularity > 100).

**Authentification:** ✅ Requise

**Query Parameters:**
- `limit?: number` - Nombre de résultats (défaut: 10)

**Réponse (200):**
```typescript
InterestResponseDto[]
```

---

### `GET /interests/search?q=musique&limit=20`
Rechercher des intérêts par nom ou description.

**Authentification:** ✅ Requise

**Query Parameters:**
- `q: string` - Terme de recherche (requis)
- `limit?: number` - Nombre de résultats (défaut: 20)

**Exemple:**
```
GET /interests/search?q=musique&limit=20
```

**Réponse (200):**
```typescript
InterestResponseDto[]
```

---

### `GET /interests/category/:category`
Récupérer les intérêts d'une catégorie spécifique.

**Authentification:** ✅ Requise

**Exemple:**
```
GET /interests/category/sports
```

**Réponse (200):**
```typescript
InterestResponseDto[]
```

---

### `GET /interests/:id`
Récupérer un intérêt spécifique par ID.

**Authentification:** ✅ Requise

**Réponse (200):**
```typescript
InterestResponseDto
```

**Erreurs possibles:**
- `404` - Intérêt non trouvé

---

### `POST /interests`
Créer un nouvel intérêt (Admin uniquement).

**Authentification:** ✅ Requise  
**Rôle:** `admin`

**Body:**
```typescript
{
  name: string;              // 2-50 caractères (requis, unique)
  description?: string;      // Max 500 caractères (optionnel)
  category: InterestCategory; // Enum (requis)
  icon?: string;             // Max 10 caractères (optionnel)
  color?: string;            // Max 20 caractères (optionnel)
  tags?: string[];           // Max 10 tags (optionnel)
  metadata?: {
    relatedInterests?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
  };
}
```

**Réponse (201):**
```typescript
InterestResponseDto
```

**Erreurs possibles:**
- `400` - Données invalides
- `409` - L'intérêt existe déjà

---

## 📦 Entités TypeScript

### `ProfileResponseDto`

```typescript
interface ProfileResponseDto {
  id: string;
  userId: string;
  bio: string;
  city: string;
  country?: string;
  age: number;
  gender: Gender;
  interestedIn: Gender[];
  photoUrl?: string;
  visibility: ProfileVisibility;
  isActive: boolean;
  isComplete: boolean;
  isVerified: boolean;
  preferences?: {
    ageRange?: { min: number; max: number };
    maxDistance?: number;
    interests?: string[];
    values?: string[];
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  viewCount: number;
  likeCount: number;
  matchCount: number;
  createdAt: Date;
  updatedAt: Date;
  isProfileComplete: boolean;      // Calculé
  ageRange: { min: number; max: number }; // Calculé ou défaut { min: 18, max: 100 }
  maxDistance: number;              // Calculé ou défaut 50
}
```

---

### `CreateProfileDto`

```typescript
interface CreateProfileDto {
  bio: string;                    // 10-500 caractères (requis)
  city: string;                   // 2-100 caractères (requis)
  country?: string;               // 2-100 caractères (optionnel)
  age: number;                    // 18-100 (requis)
  gender: Gender;                 // Enum (requis)
  interestedIn: Gender[];         // Array (requis, minimum 1)
  photoUrl?: string;              // URL valide (optionnel)
  visibility?: ProfileVisibility; // Enum (optionnel, défaut: PUBLIC)
  preferences?: {
    ageRange?: { min: number; max: number };
    maxDistance?: number;         // 1-1000 km
    interests?: string[];        // Note: actuellement stocké dans preferences, pas lié via relation
    values?: string[];
  };
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
}
```

---

### `UpdateProfileDto`

```typescript
// Tous les champs de CreateProfileDto sont optionnels
type UpdateProfileDto = Partial<CreateProfileDto>;
```

---

### `InterestResponseDto`

```typescript
interface InterestResponseDto {
  id: string;
  name: string;
  description?: string;
  category: InterestCategory;
  icon?: string;
  color?: string;
  isActive: boolean;
  profileCount: number;
  popularityScore: number;
  tags: string[];
  metadata?: {
    relatedInterests?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  isPopular: boolean;           // Calculé (popularityScore > 50)
  isTrending: boolean;           // Calculé (popularityScore > 100)
  displayName: string;           // Calculé (= name)
  searchableText: string;       // Calculé (name + description + tags)
}
```

---

### `CreateInterestDto`

```typescript
interface CreateInterestDto {
  name: string;              // 2-50 caractères (requis, unique)
  description?: string;      // Max 500 caractères (optionnel)
  category: InterestCategory; // Enum (requis)
  icon?: string;             // Max 10 caractères (optionnel)
  color?: string;            // Max 20 caractères (optionnel)
  tags?: string[];           // Max 10 tags (optionnel)
  metadata?: {
    relatedInterests?: string[];
    keywords?: string[];
    searchWeight?: number;
    displayOrder?: number;
  };
}
```

---

## 🔢 Enums

### `Gender`

```typescript
enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}
```

---

### `ProfileVisibility`

```typescript
enum ProfileVisibility {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private'
}
```

---

### `InterestCategory`

```typescript
enum InterestCategory {
  SPORTS = 'sports',
  MUSIC = 'music',
  ARTS = 'arts',
  TRAVEL = 'travel',
  FOOD = 'food',
  TECHNOLOGY = 'technology',
  HEALTH = 'health',
  EDUCATION = 'education',
  BUSINESS = 'business',
  ENTERTAINMENT = 'entertainment',
  LIFESTYLE = 'lifestyle',
  OTHER = 'other'
}
```

---

## 📝 Notes importantes

### ⚠️ Liaison des Intérêts

**Note actuelle:** La relation `ManyToMany` entre `Profile` et `Interest` existe dans l'entité, mais la gestion des intérêts lors de la création/mise à jour du profil n'est pas encore complètement implémentée dans le service.

**Workaround actuel:**
- Les intérêts peuvent être passés dans `preferences.interests` comme un tableau de strings (noms d'intérêts)
- Pour une liaison complète via la relation, il faudra peut-être implémenter un endpoint séparé ou mettre à jour le service de profils

**Recommandation:**
1. Utiliser `preferences.interests` pour stocker les noms d'intérêts pour l'instant
2. Ou attendre une implémentation future qui liera les intérêts via la relation `ManyToMany`

---

### ✅ Validation

Toutes les validations sont faites côté backend avec `class-validator`. Les erreurs de validation retournent un `400 Bad Request` avec les détails des champs invalides.

---

### 🔄 Comportement de profil

- Le profil est automatiquement lié à l'utilisateur connecté lors de la création
- Un utilisateur ne peut avoir qu'un seul profil
- La création d'un profil échoue si le profil existe déjà (409 Conflict)
- La suppression est un "soft delete" (isActive = false), sauf pour les admins qui peuvent faire un "hard delete"

---

### 📊 Statut de complétion

Le champ `isProfileComplete` est calculé automatiquement. Un profil est considéré complet si:
- `bio` est présent
- `city` est présent
- `age` est présent
- `gender` est présent
- `photoUrl` est présent
- `interestedIn.length > 0`

---

## 🚀 Exemple d'utilisation complète

### Workflow d'onboarding

1. **Récupérer les intérêts disponibles**
```typescript
GET /api/v1/interests/popular?limit=20
```

2. **Créer le profil**
```typescript
POST /api/v1/profiles
{
  "bio": "Passionné de randonnée et de lecture",
  "city": "Paris",
  "country": "France",
  "age": 28,
  "gender": "male",
  "interestedIn": ["female", "non_binary"],
  "photoUrl": "https://example.com/photo.jpg",
  "preferences": {
    "ageRange": { "min": 22, "max": 35 },
    "maxDistance": 50,
    "interests": ["Randonnée", "Lecture", "Voyage"]
  }
}
```

3. **Récupérer le profil créé**
```typescript
GET /api/v1/profiles/my
```

4. **Mettre à jour le profil si nécessaire**
```typescript
PATCH /api/v1/profiles/{profileId}
{
  "bio": "Nouvelle bio mise à jour"
}
```

---

## 📚 Documentation Swagger

La documentation Swagger complète est disponible à:
```
/api/docs
```

Tous les endpoints sont documentés avec des exemples de requêtes et réponses.

---

## 🐛 Gestion des erreurs

Les erreurs suivent le format standard NestJS:

```typescript
{
  "statusCode": 400,
  "message": ["validation error messages"],
  "error": "Bad Request"
}
```

Codes HTTP courants:
- `200` - Succès
- `201` - Créé
- `204` - Pas de contenu (suppression)
- `400` - Erreur de validation
- `401` - Non authentifié
- `403` - Accès interdit
- `404` - Non trouvé
- `409` - Conflit (ressource existe déjà)


