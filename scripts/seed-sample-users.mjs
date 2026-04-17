import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getFirestore, setDoc } from 'firebase/firestore'
import { loadEnv } from 'vite'

const env = loadEnv('', process.cwd(), '')

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missingKeys = requiredKeys.filter((key) => !env[key])

if (missingKeys.length > 0) {
  console.error(`Missing Firebase environment variables: ${missingKeys.join(', ')}`)
  process.exit(1)
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

const auth = getAuth(app)
const db = getFirestore(app)

const sampleUsers = [
  {
    email: 'emma.frosting@example.com',
    password: 'Santa2026!',
    publicProfile: {
      name: 'Emma Frosting',
      discordName: 'emma_cookies',
      address: '12 Candy Cane Lane',
      receiver: null,
      receiverAddress: null,
      hasSecretSanta: false,
      presents: [
        {
          headline: 'Cozy Blanket',
          description: 'Soft and warm for winter nights',
          link: 'Blanket idea',
          url: 'https://example.com/blanket',
          image: null,
        },
        {
          headline: 'Hot Chocolate Set',
          description: 'Fancy mugs and cocoa mix',
          link: 'Cocoa set',
          url: 'https://example.com/cocoa',
          image: null,
        },
      ],
      role: 'user',
    },
    privateProfile: {
      excludedReceiverIds: [],
    },
  },
  {
    email: 'leo.lantern@example.com',
    password: 'Santa2026!',
    publicProfile: {
      name: 'Leo Lantern',
      discordName: 'leo_gifts',
      address: '88 Winter Oak Road',
      receiver: null,
      receiverAddress: null,
      hasSecretSanta: false,
      presents: [
        {
          headline: 'Desk Lamp',
          description: 'Warm light for late-night gaming',
          link: 'Lamp link',
          url: 'https://example.com/lamp',
          image: null,
        },
      ],
      role: 'user',
    },
    privateProfile: {
      excludedReceiverIds: [],
    },
  },
  {
    email: 'nina.snow@example.com',
    password: 'Santa2026!',
    publicProfile: {
      name: 'Nina Snow',
      discordName: 'ninaflakes',
      address: '5 Snowdrop Court',
      receiver: null,
      receiverAddress: null,
      hasSecretSanta: false,
      presents: [
        {
          headline: 'Tea Sampler',
          description: 'Mixed herbal and black teas',
          link: 'Tea box',
          url: 'https://example.com/tea',
          image: null,
        },
      ],
      role: 'user',
    },
    privateProfile: {
      excludedReceiverIds: [],
    },
  },
]

async function ensureUser(user) {
  let credential

  try {
    credential = await createUserWithEmailAndPassword(auth, user.email, user.password)
    console.log(`Created auth user: ${user.email}`)
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'auth/email-already-in-use'
    ) {
      credential = await signInWithEmailAndPassword(auth, user.email, user.password)
      console.log(`Using existing auth user: ${user.email}`)
    } else {
      throw error
    }
  }

  const uid = credential.user.uid

  await Promise.all([
    setDoc(doc(db, 'users', uid), user.publicProfile, { merge: true }),
    setDoc(
      doc(db, 'userPrivate', uid),
      {
        email: user.email,
        ...user.privateProfile,
      },
      { merge: true },
    ),
  ])

  console.log(`Upserted Firestore docs for ${user.email}`)
  await signOut(auth)
}

async function main() {
  for (const user of sampleUsers) {
    await ensureUser(user)
  }

  console.log(`Done. Seeded ${sampleUsers.length} sample non-admin users.`)
}

main().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
