import { Gender } from '../profiles/entities/profile.entity';

export interface TestAccountFixture {
  slug: string;
  userId: string;
  profileId: string;
  betterAuthAccountId: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  interestedIn: Gender[];
  birthdate: string;
  age: number;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  intention: string;
  bio: string;
  interests: string[];
  values?: string[];
  photos: string[];
  preference: {
    ageMin: number;
    ageMax: number;
    distanceKm: number;
  };
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
}

export const TEST_ACCOUNT_FIXTURES: TestAccountFixture[] = [
  {
    slug: 'amelie-durand',
    userId: '23480a45-986d-4df5-b335-10ba1337fced',
    profileId: '84771609-102d-4cd9-9a8b-dbdf96cb9f68',
    betterAuthAccountId: '180f29c0-4527-40f5-8f8c-8d0960a961b5',
    email: 'amelie.durand+test@wetwo.app',
    firstName: 'Amelie',
    lastName: 'Durand',
    gender: Gender.FEMALE,
    interestedIn: [Gender.MALE],
    birthdate: '1994-03-12',
    age: 31,
    city: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    intention: 'Partager des discussions profondes et un cafe bien dose.',
    bio: 'Product designer passionnee par la photo argentique et les balades matinales sur les quais.',
    interests: ['Photography', 'Coffee', 'Running', 'Yoga'],
    values: ['Kindness', 'Creativity'],
    photos: [
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 27,
      ageMax: 36,
      distanceKm: 50,
    },
    socialLinks: {
      instagram: 'https://instagram.com/amelie.moves',
    },
  },
  {
    slug: 'lina-moreau',
    userId: 'ecf8be91-1b01-480b-9b8b-3728af3793cd',
    profileId: '8c415f4e-17f7-4857-ab50-195f32eafdd3',
    betterAuthAccountId: '82b4bc1b-043e-4a5b-a23b-1fc1cfa0b436',
    email: 'lina.moreau+test@wetwo.app',
    firstName: 'Lina',
    lastName: 'Moreau',
    gender: Gender.FEMALE,
    interestedIn: [Gender.MALE, Gender.NON_BINARY],
    birthdate: '1991-11-04',
    age: 33,
    city: 'Marseille',
    country: 'France',
    latitude: 43.2965,
    longitude: 5.3698,
    intention: 'Trouver un partenaire de randonnee et de bons petits plats.',
    bio: 'Cheffe freelance, je collectionne les recettes familiales et les couchers de soleil sur la Corniche.',
    interests: ['Cooking', 'Hiking', 'Wine Tasting', 'Meditation'],
    values: ['Family', 'Balance'],
    photos: [
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 30,
      ageMax: 40,
      distanceKm: 80,
    },
    socialLinks: {
      instagram: 'https://instagram.com/lina.plats',
      website: 'https://linamoreau.fr',
    },
  },
  {
    slug: 'clara-petit',
    userId: '82d68efe-687d-43b2-9e1f-089da02e2764',
    profileId: '61fef556-964d-4a61-89bf-64c0dcc34dc4',
    betterAuthAccountId: '7d4da713-26c3-4a66-91ea-6a57e7841820',
    email: 'clara.petit+test@wetwo.app',
    firstName: 'Clara',
    lastName: 'Petit',
    gender: Gender.FEMALE,
    interestedIn: [Gender.MALE],
    birthdate: '1996-07-18',
    age: 28,
    city: 'Lyon',
    country: 'France',
    latitude: 45.764,
    longitude: 4.8357,
    intention: 'Partager des concerts et des w-e improvises.',
    bio: 'Consultante en innovation le jour, saxophoniste amateure la nuit. Toujours partante pour un escape game.',
    interests: ['Jazz', 'Climbing', 'Board Games', 'Running'],
    values: ['Curiosity', 'Playfulness'],
    photos: [
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 27,
      ageMax: 35,
      distanceKm: 60,
    },
  },
  {
    slug: 'ines-robert',
    userId: '3d4225ea-b034-44b7-844a-d45bd91ca01d',
    profileId: '601a3cee-9152-44e6-84ea-631333fcad3b',
    betterAuthAccountId: '04dac8d8-7643-441e-b8c4-56201aabc5e5',
    email: 'ines.robert+test@wetwo.app',
    firstName: 'Ines',
    lastName: 'Robert',
    gender: Gender.FEMALE,
    interestedIn: [Gender.MALE],
    birthdate: '1990-02-02',
    age: 35,
    city: 'Toulouse',
    country: 'France',
    latitude: 43.6047,
    longitude: 1.4442,
    intention: 'Construire une relation authentique autour de projets communs.',
    bio: 'Ingenieure climatique, je passe mes soirees a bricoler des meubles et a apprendre le kitesurf.',
    interests: ['Sustainable Living', 'Surfing', 'Cycling', 'Meditation'],
    values: ['Sustainability', 'Trust'],
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 32,
      ageMax: 42,
      distanceKm: 120,
    },
  },
  {
    slug: 'sarah-lopes',
    userId: '7a3b6b49-e8af-458b-a652-7f514ce5529e',
    profileId: 'cf3988d3-3c7f-4cbc-9b78-6f0311288b86',
    betterAuthAccountId: 'aa26ff7e-d92a-4dcd-8992-5969f971fc4b',
    email: 'sarah.lopes+test@wetwo.app',
    firstName: 'Sarah',
    lastName: 'Lopes',
    gender: Gender.FEMALE,
    interestedIn: [Gender.MALE],
    birthdate: '1993-05-09',
    age: 32,
    city: 'Bordeaux',
    country: 'France',
    latitude: 44.8378,
    longitude: -0.5792,
    intention: 'Relever des challenges sportifs et cuisiner des brunchs maison.',
    bio: 'Coach sportive, fan de paddle et de podcasts true crime. Mon chat Tofu approuve les gens patients.',
    interests: ['Fitness', 'Surfing', 'Cooking', 'Street Food'],
    values: ['Honesty', 'Energy'],
    photos: [
      'https://images.unsplash.com/photo-1525130413817-d45c1d127c42?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 29,
      ageMax: 37,
      distanceKm: 90,
    },
  },
  {
    slug: 'lucas-bernard',
    userId: '2691827a-5b37-46f6-bd17-cc36251c432d',
    profileId: '88e1e9aa-5008-4e7a-ab2c-d209df5ba43e',
    betterAuthAccountId: '62ad6dbe-3ba5-4612-bc7e-8c069de48e8f',
    email: 'lucas.bernard+test@wetwo.app',
    firstName: 'Lucas',
    lastName: 'Bernard',
    gender: Gender.MALE,
    interestedIn: [Gender.FEMALE],
    birthdate: '1992-09-27',
    age: 32,
    city: 'Paris',
    country: 'France',
    latitude: 48.853,
    longitude: 2.3499,
    intention: 'Partager des expositions, du theatre et des escapades europeennes.',
    bio: 'Product manager dans la tech, marathonien amateur, je collectionne les vinyles et les carnets de voyage.',
    interests: ['Running', 'Street Art', 'Coffee', 'Jazz'],
    values: ['Ambition', 'Empathy'],
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 27,
      ageMax: 36,
      distanceKm: 40,
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/lucas-bernard',
    },
  },
  {
    slug: 'tom-leroy',
    userId: 'd3f6ee15-402f-4c08-8ccb-2eaa9e3a2756',
    profileId: 'c58e7a58-b116-467c-aad0-0865ad119ef4',
    betterAuthAccountId: '65638ea3-43ff-4098-8fa9-3a76106f0524',
    email: 'tom.leroy+test@wetwo.app',
    firstName: 'Tom',
    lastName: 'Leroy',
    gender: Gender.MALE,
    interestedIn: [Gender.FEMALE],
    birthdate: '1989-01-15',
    age: 36,
    city: 'Nantes',
    country: 'France',
    latitude: 47.2184,
    longitude: -1.5536,
    intention: 'Changer de vie vers plus de simplicite et de nature.',
    bio: 'Architecte naval, je passe mes week-ends a restaurer un vieux combi et a jardiner en permaculture.',
    interests: ['Outdoor', 'Gardening', 'Sustainable Living', 'Wine Tasting'],
    values: ['Patience', 'Simplicity'],
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 30,
      ageMax: 40,
      distanceKm: 150,
    },
  },
  {
    slug: 'noah-fontaine',
    userId: '1a350703-5c7b-409b-a310-6697694d372e',
    profileId: '10fb8216-b523-4b3a-9605-d4499c0f95b7',
    betterAuthAccountId: 'c9cc8dca-f1b7-4f72-b27a-d8982302e1ea',
    email: 'noah.fontaine+test@wetwo.app',
    firstName: 'Noah',
    lastName: 'Fontaine',
    gender: Gender.MALE,
    interestedIn: [Gender.FEMALE, Gender.NON_BINARY],
    birthdate: '1995-12-01',
    age: 29,
    city: 'Montpellier',
    country: 'France',
    latitude: 43.6108,
    longitude: 3.8767,
    intention: 'Rencontrer quelqu un de curieux pour decouvrir des scenes culturelles.',
    bio: 'Journaliste musical, fan de festivals et de petits restos caches. Je voyage toujours avec mon appareil photo.',
    interests: ['Electronic', 'Surfing', 'Street Food', 'Photography'],
    values: ['Adventure', 'Respect'],
    photos: [
      'https://images.unsplash.com/photo-1520785643438-813263b77326?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 25,
      ageMax: 34,
      distanceKm: 70,
    },
  },
  {
    slug: 'ethan-caron',
    userId: '3ff0b5af-36a3-469f-970d-f98486e48aa0',
    profileId: '1ffe586e-d891-48e3-a10f-6f17808b6bb0',
    betterAuthAccountId: '8cd2f8f1-20bd-49b8-82f6-abf1eb2ea287',
    email: 'ethan.caron+test@wetwo.app',
    firstName: 'Ethan',
    lastName: 'Caron',
    gender: Gender.MALE,
    interestedIn: [Gender.FEMALE],
    birthdate: '1990-08-22',
    age: 34,
    city: 'Strasbourg',
    country: 'France',
    latitude: 48.5734,
    longitude: 7.7521,
    intention: 'Construire une relation stable et joyeuse.',
    bio: 'Pediatre, passionne de montagne et d aquarelle. J anime un club de lecture tous les mois.',
    interests: ['Hiking', 'Classical', 'Board Games', 'Cooking'],
    values: ['Care', 'Stability'],
    photos: [
      'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 30,
      ageMax: 38,
      distanceKm: 100,
    },
  },
  {
    slug: 'mathis-perrot',
    userId: '877d927f-6d72-4d44-9bc4-a0ffc100f524',
    profileId: '8c40e0ca-6697-4db4-a2a0-b4965ce6ea0b',
    betterAuthAccountId: 'f1e169fb-dec7-4f3a-a9e0-672f54be52a1',
    email: 'mathis.perrot+test@wetwo.app',
    firstName: 'Mathis',
    lastName: 'Perrot',
    gender: Gender.MALE,
    interestedIn: [Gender.FEMALE],
    birthdate: '1997-04-30',
    age: 27,
    city: 'Lille',
    country: 'France',
    latitude: 50.6292,
    longitude: 3.0573,
    intention: 'Partager des projets artistiques et un sens aigu de l humour.',
    bio: 'Illustrateur freelance, fan de skate et de cinema d auteur. Toujours partant pour un atelier serigraphie.',
    interests: ['Street Art', 'Dance', 'Indie', 'Coffee'],
    values: ['Creativity', 'Humor'],
    photos: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?auto=format&fit=crop&w=800&q=80',
    ],
    preference: {
      ageMin: 24,
      ageMax: 32,
      distanceKm: 60,
    },
  },
];

export const TEST_ACCOUNT_USER_IDS = TEST_ACCOUNT_FIXTURES.map(
  (fixture) => fixture.userId,
);
