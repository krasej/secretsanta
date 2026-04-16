import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const usersCollection = collection(db, 'users')

export type User = {
  id: string
  name: string
  discordName: string
  isAdmin?: boolean
  giftee?: string
  presents?: stringK
  address?: string
}

export async function signUp(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export async function logOut(): Promise<void> {
  await signOut(auth)
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function getCurrentUser(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export async function createUserProfile(uid: string, userData: Omit<User, 'id'>): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    name: userData.name,
    discordName: userData.discordName,
    isAdmin: userData.isAdmin || false,
    giftee: userData.giftee || null,
    presents: userData.presents || null,
    address: userData.address || null,
  })
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const docSnap = await getDoc(doc(db, 'users', uid))
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as User
  }
  return null
}

export async function updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), updates)
}

export async function getUsers(): Promise<User[]> {
  const q = query(usersCollection, orderBy('name'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) }))
}

export async function getUsersByDiscordName(discordName: string): Promise<User[]> {
  const q = query(usersCollection, where('discordName', '==', discordName))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<User, 'id'>) }))
}
