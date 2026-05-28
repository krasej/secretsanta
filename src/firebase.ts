import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseAuthUser,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const usersCollection = collection(db, 'users')

function normalizeExcludedIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.length > 0)
  }
  if (typeof value === 'string' && value.length > 0) {
    return [value]
  }
  return []
}

export type PresentItem = {
  headline: string
  description?: string
  url: string
  image?: string | null
}

export type PresentsJson = PresentItem[]

export type UserProfile = {
  id: string
  name: string
  discordName: string
  receiver?: string | null
  presents?: PresentsJson
  role?: 'admin' | 'user'
  email?: string
  address?: string | null
  receiverAddress?: string | null
  hasSecretSanta?: boolean
  excludedReceiverIds?: string[]
}

export type FirebaseUser = FirebaseAuthUser

export async function registerUser(
  email: string,
  password: string,
  profile: Omit<UserProfile, 'id' | 'role' | 'email'>,
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  await setDoc(doc(db, 'users', uid), {
    name: profile.name,
    discordName: profile.discordName,
    address: profile.address || null,
    receiver: profile.receiver || null,
    receiverAddress: profile.receiverAddress || null,
    presents: profile.presents ?? [],
    role: 'user',
    hasSecretSanta: profile.hasSecretSanta ?? false,
    excludedReceiverIds: profile.excludedReceiverIds ?? [],
    email,
  })

  return credential.user
}

export async function deleteUser(uid: string) {
  if (auth.currentUser?.uid === uid) {
    await deleteDoc(doc(db, 'users', uid))

    // Firebase Auth allows client-side deletion only for the current signed-in user.
    await deleteAuthUser(auth.currentUser)

    signOutUser()
  }
}

export async function loginUser(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export function signOutUser() {
  return signOut(auth)
}

export function onAuthStateChange(callback: (user: FirebaseAuthUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const publicSnapshot = await getDoc(doc(db, 'users', uid))
  if (!publicSnapshot.exists()) {
    return null
  }

  const rawData = publicSnapshot.data() as Omit<UserProfile, 'id'>
  const profile = {
    id: publicSnapshot.id,
    ...rawData,
    excludedReceiverIds: normalizeExcludedIds(rawData.excludedReceiverIds),
  } as UserProfile

  return profile
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(query(usersCollection, orderBy('name')))
  return snapshot.docs.map((item) => {
    const rawData = item.data() as Omit<UserProfile, 'id'>
    return {
      id: item.id,
      ...rawData,
      excludedReceiverIds: normalizeExcludedIds(rawData.excludedReceiverIds),
    }
  })
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const publicUpdates: Partial<UserProfile> = {}

  if (updates.name !== undefined) {
    publicUpdates.name = updates.name
  }
  if (updates.discordName !== undefined) {
    publicUpdates.discordName = updates.discordName
  }
  if (updates.address !== undefined) {
    publicUpdates.address = updates.address
  }
  if (updates.receiver !== undefined) {
    publicUpdates.receiver = updates.receiver
  }
  if (updates.presents !== undefined) {
    publicUpdates.presents = updates.presents
  }
  if (updates.role !== undefined) {
    publicUpdates.role = updates.role
  }
  if (updates.hasSecretSanta !== undefined) {
    publicUpdates.hasSecretSanta = updates.hasSecretSanta
  }
  if (updates.receiverAddress !== undefined) {
    publicUpdates.receiverAddress = updates.receiverAddress
  }

  if (updates.excludedReceiverIds !== undefined) {
    publicUpdates.excludedReceiverIds = updates.excludedReceiverIds
  }

  if (updates.email !== undefined) {
    publicUpdates.email = updates.email
  }

  const writes: Promise<unknown>[] = []

  if (Object.keys(publicUpdates).length > 0) {
    writes.push(setDoc(doc(db, 'users', uid), publicUpdates, { merge: true }))
  }

  await Promise.all(writes)
}

export function getCurrentUser() {
  return auth.currentUser
}
