import { initializeApp } from 'firebase/app'
import { deleteUser, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { deleteDoc, doc, getFirestore } from 'firebase/firestore'
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
  { email: 'emma.frosting@example.com', password: 'Santa2026!' },
  { email: 'leo.lantern@example.com', password: 'Santa2026!' },
  { email: 'nina.snow@example.com', password: 'Santa2026!' },
]

async function removeUser(user) {
  try {
    const credential = await signInWithEmailAndPassword(auth, user.email, user.password)
    const currentUser = credential.user
    const uid = currentUser.uid

    await currentUser.getIdToken(true)

    await deleteDoc(doc(db, 'users', uid))
    await deleteDoc(doc(db, 'userPrivate', uid))
    await deleteUser(currentUser)

    console.log(`Removed sample user: ${user.email}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'permission-denied') {
        console.warn(
          `Skipped ${user.email}: ${error.code}. Publish the latest Firestore rules and try again.`,
        )
      } else {
        console.warn(`Skipped ${user.email}: ${error.code}`)
      }
    } else {
      console.warn(`Skipped ${user.email}: unknown error`)
    }
  } finally {
    await signOut(auth).catch(() => undefined)
  }
}

async function main() {
  for (const user of sampleUsers) {
    await removeUser(user)
  }

  console.log(`Done. Attempted removal of ${sampleUsers.length} sample users.`)
}

main().catch((error) => {
  console.error('Removal failed:', error)
  process.exit(1)
})
