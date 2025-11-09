# Database Seeders

Ce dossier contient les scripts de seeding pour peupler la base de données avec des données initiales.

## 🚀 Utilisation

### Seeder les intérêts

Pour ajouter les intérêts à la base de données **sans** supprimer les données existantes :

```bash
npm run seed
```

### Seeder avec drop de la base de données

Pour **supprimer toutes les tables** et recréer la base de données avant de seeder :

```bash
npm run seed:drop
```

Ou avec l'option explicite :

```bash
npm run seed -- --drop
# ou
npm run seed -- -d
```

## 📋 Liste des seeders

### Interests Seeder (`interests.seeder.ts`)

Ce seeder ajoute une liste complète d'intérêts organisés par catégories :
- **SPORTS** : Football, Basketball, Tennis, Running, Cycling, Swimming, Yoga, Fitness, Hiking, Climbing, etc.
- **MUSIC** : Pop, Rock, Jazz, Classical, Electronic, Hip Hop, Country, etc.
- **ARTS** : Painting, Drawing, Photography, Sculpture, Writing, Theater, Dance, etc.
- **TRAVEL** : Backpacking, City Breaks, Beach Holidays, Adventure Travel, etc.
- **FOOD** : Cooking, Baking, Wine Tasting, Coffee, Craft Beer, Italian Cuisine, etc.
- **TECHNOLOGY** : Programming, AI, Gaming, Web Development, Mobile Apps, etc.
- **HEALTH** : Meditation, Nutrition, Mental Health, Wellness, etc.
- **EDUCATION** : Languages, History, Philosophy, Science, etc.
- **BUSINESS** : Entrepreneurship, Investment, Marketing, etc.
- **ENTERTAINMENT** : Movies, TV Shows, Comics, Podcasts, etc.
- **LIFESTYLE** : Fashion, Interior Design, Gardening, Pets, etc.
- **OTHER** : Astrology, Collecting, Volunteering, etc.

**Total :** ~150+ intérêts

### Test Accounts Seeder (`test-accounts.seeder.ts`)

- Crée une dizaine de comptes **BetterAuth + users + profils + photos** prêts à matcher.
- Les données couvrent différentes villes françaises avec des profils complets (bio, centres d'intérêt, préférences, photos).
- **Contrôlé par la variable `FEATURE_TEST_ACCOUNTS`** :
  1. Activer le flag dans `.env` (`FEATURE_TEST_ACCOUNTS=true`)
  2. Lancer `npm run seed` (ou `npm run seed:drop`)
  3. Les comptes restent en base ; repassez le flag à `false` si vous voulez désactiver leur présence côté matchmaking.
- Les intérêts manquants sont automatiquement reliés au profil via la table de jointure `profile_interests`.

## 🔧 Ajouter un nouveau seeder

1. Créer un nouveau fichier dans `seeders/` (ex: `users.seeder.ts`)
2. Créer votre liste de données à seeder
3. Créer une fonction `seedXxx(dataSource: DataSource)` dans `seed.ts`
4. Appeler cette fonction dans la fonction `main()`

Exemple :

```typescript
// seeders/users.seeder.ts
export const USERS_SEED_DATA = [
  { email: 'user1@example.com', ... },
  { email: 'user2@example.com', ... },
];

// seed.ts
async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  // ... seeding logic
}

// Dans main()
await seedUsers(dataSource);
```

## ⚠️ Important

- Le seeder vérifie l'existence des données avant de les créer (évite les doublons)
- Le `--drop` option supprime **toutes** les tables et données
- Utilisez `--drop` uniquement en développement
- En production, utilisez des migrations plutôt que `synchronize: true`

## 🔐 Variables d'environnement

Assurez-vous que les variables suivantes sont définies dans votre `.env` :

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=flint_db
```

Ou utilisez `DATABASE_URL` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```



