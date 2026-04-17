import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseAuthUser,
} from 'firebase/auth'
import {
  collection,
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
const privateProfilesCollection = collection(db, 'userPrivate')

export type PresentItem = {
  headline: string
  description?: string
  link: string
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
}

export type FirebaseUser = FirebaseAuthUser

export async function registerUser(
  email: string,
  password: string,
  profile: Omit<UserProfile, 'id' | 'role' | 'email'>,
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  await Promise.all([
    setDoc(doc(db, 'users', uid), {
      name: profile.name,
      discordName: profile.discordName,
      receiver: profile.receiver || null,
      presents: profile.presents ?? [],
      role: 'user',
    }),
    setDoc(doc(db, 'userPrivate', uid), {
      email,
      address: profile.address || null,
      receiverAddress: profile.receiverAddress || null,
    }),
  ])

  return credential.user
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

export async function getUserProfile(
  uid: string,
  includePrivate = true,
): Promise<UserProfile | null> {
  const publicSnapshot = await getDoc(doc(db, 'users', uid))
  if (!publicSnapshot.exists()) {
    return null
  }

  const profile = {
    id: publicSnapshot.id,
    ...(publicSnapshot.data() as Omit<UserProfile, 'id'>),
  } as UserProfile

  if (!includePrivate) {
    return profile
  }

  const privateSnapshot = await getDoc(doc(db, 'userPrivate', uid))
  if (privateSnapshot.exists()) {
    Object.assign(profile, privateSnapshot.data())
  }

  return profile
}

export async function getAllUsers(
  options: { includePrivate?: boolean } = {},
): Promise<UserProfile[]> {
  const snapshot = await getDocs(query(usersCollection, orderBy('name')))
  const profiles = snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<UserProfile, 'id'>),
  }))

  if (!options.includePrivate) {
    return profiles
  }

  return Promise.all(
    profiles.map(async (profile) => {
      const privateSnapshot = await getDoc(doc(privateProfilesCollection, profile.id))
      if (privateSnapshot.exists()) {
        return { ...profile, ...(privateSnapshot.data() as Partial<UserProfile>) }
      }
      return profile
    }),
  )
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>) {
  const publicUpdates: Partial<UserProfile> = {}
  const privateUpdates: Partial<UserProfile> = {}

  if (updates.name !== undefined) {
    publicUpdates.name = updates.name
  }
  if (updates.discordName !== undefined) {
    publicUpdates.discordName = updates.discordName
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

  if (updates.email !== undefined) {
    privateUpdates.email = updates.email
  }
  if (updates.address !== undefined) {
    privateUpdates.address = updates.address
  }
  if (updates.receiverAddress !== undefined) {
    privateUpdates.receiverAddress = updates.receiverAddress
  }

  const writes: Promise<unknown>[] = []

  if (Object.keys(publicUpdates).length > 0) {
    writes.push(setDoc(doc(db, 'users', uid), publicUpdates, { merge: true }))
  }

  if (Object.keys(privateUpdates).length > 0) {
    writes.push(setDoc(doc(db, 'userPrivate', uid), privateUpdates, { merge: true }))
  }

  await Promise.all(writes)
}

export function getCurrentUser() {
  return auth.currentUser
}
