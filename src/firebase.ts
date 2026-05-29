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
    receiver: profile.receiver || null,
    presents: profile.presents ?? [],
    role: 'user',
    hasSecretSanta: profile.hasSecretSanta ?? false,
    excludedReceiverIds: profile.excludedReceiverIds ?? [],
    email,
  })

  await setDoc(doc(db, 'userPrivate', uid), {
    address: profile.address || null,
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

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL ?? ''

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const publicSnapshot = await getDoc(doc(db, 'users', uid))
  if (!publicSnapshot.exists()) {
    return null
  }

  const rawData = publicSnapshot.data() as Omit<UserProfile, 'id'>
  const profile: UserProfile = {
    id: publicSnapshot.id,
    ...rawData,
    excludedReceiverIds: normalizeExcludedIds(rawData.excludedReceiverIds),
  } as UserProfile

  if (auth.currentUser?.uid === uid) {
    const privateSnapshot = await getDoc(doc(db, 'userPrivate', uid))
    if (privateSnapshot.exists()) {
      const privateData = privateSnapshot.data() as Partial<UserProfile>
      profile.address = privateData.address ?? null
    }
  }

  return profile
}

export async function fetchPrivateUserData(userId: string) {
  const current = auth.currentUser
  if (!current) {
    return null
  }

  const token = await current.getIdToken()
  const response = await fetch(`${backendBaseUrl}/api/users/${userId}/private`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as { address: string | null }
}

export async function fetchPreviewImage(url: string): Promise<string | null> {
  const current = auth.currentUser
  if (!current) {
    return null
  }

  const token = await current.getIdToken()
  const response = await fetch(`${backendBaseUrl}/api/preview?url=${encodeURIComponent(url)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return (data as { imageUrl: string | null }).imageUrl ?? null
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(query(usersCollection, orderBy('name')))
  return snapshot.docs.map((item) => {
    const rawData = item.data() as Omit<UserProfile, 'id'>
    return {
      id: item.id,
      name: rawData.name,
      discordName: rawData.discordName,
      presents: rawData.presents ?? [],
      role: rawData.role,
      hasSecretSanta: rawData.hasSecretSanta ?? false,
      excludedReceiverIds: normalizeExcludedIds(rawData.excludedReceiverIds),
    }
  })
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
  if (updates.hasSecretSanta !== undefined) {
    publicUpdates.hasSecretSanta = updates.hasSecretSanta
  }
  if (updates.excludedReceiverIds !== undefined) {
    publicUpdates.excludedReceiverIds = updates.excludedReceiverIds
  }
  if (updates.email !== undefined) {
    publicUpdates.email = updates.email
  }

  if (updates.address !== undefined) {
    privateUpdates.address = updates.address
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
