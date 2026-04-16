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

export type UserProfile = {
  id: string
  email: string
  name: string
  discordName: string
  giftee?: string | null
  presents?: string | null
  address?: string | null
  role?: 'admin' | 'user'
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
    email,
    name: profile.name,
    discordName: profile.discordName,
    giftee: profile.giftee || null,
    presents: profile.presents || null,
    address: profile.address || null,
    role: 'user',
  })

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

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<UserProfile, 'id'>),
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snapshot = await getDocs(query(usersCollection, orderBy('name')))
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<UserProfile, 'id'>),
  }))
}

export function getCurrentUser() {
  return auth.currentUser
}
