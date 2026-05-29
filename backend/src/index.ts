import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { readFile } from 'node:fs/promises'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import {
  AuthenticatedRequest,
  canReadPrivate,
  canUpdatePrivate,
  getPrivatePayload,
  getUserDoc,
  parsePrivateUpdates,
  safeProfile,
  updatePrivateDoc,
  verifyToken,
} from './users.js'

dotenv.config()

const port = Number(process.env.PORT ?? 4000)

async function createFirebaseApp() {
  if (getApps().length > 0) {
    return
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (!serviceAccountPath && !serviceAccountJson) {
    throw new Error(
      'Missing Firebase service account credentials. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.',
    )
  }

  const serviceAccount = serviceAccountJson
    ? JSON.parse(serviceAccountJson)
    : JSON.parse(await readFile(serviceAccountPath!, 'utf8'))

  initializeApp({ credential: cert(serviceAccount) })
}

await createFirebaseApp()

const db = getFirestore()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/users', verifyToken, async (_req, res) => {
  const snapshot = await db.collection('users').get()
  const users = snapshot.docs.map((doc) => safeProfile(doc.id, doc.data()))
  res.json(users.filter(Boolean))
})

app.get('/api/users/:userId', verifyToken, async (req: AuthenticatedRequest, res) => {
  const userDoc = await getUserDoc(req.params.userId)
  const profile = safeProfile(req.params.userId, userDoc ?? undefined)
  if (!profile) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(profile)
})

app.get('/api/me', verifyToken, async (req: AuthenticatedRequest, res) => {
  const uid = req.user?.uid
  if (!uid) {
    return res.status(401).json({ error: 'Missing authenticated UID' })
  }
  const data = await getUserDoc(uid)
  if (!data) {
    return res.status(404).json({ error: 'User record not found' })
  }
  res.json({
    ...safeProfile(uid, data),
    receiver: data.receiver ?? null,
  })
})

app.get('/api/me/private', verifyToken, async (req: AuthenticatedRequest, res) => {
  const uid = req.user?.uid
  if (!uid) {
    return res.status(401).json({ error: 'Missing authenticated UID' })
  }

  const privatePayload = await getPrivatePayload(uid)
  if (!privatePayload) {
    return res.status(404).json({ error: 'No private data found' })
  }

  res.json(privatePayload)
})

app.get('/api/users/:userId/private', verifyToken, async (req: AuthenticatedRequest, res) => {
  const uid = req.user?.uid
  if (!uid) {
    return res.status(401).json({ error: 'Missing authenticated UID' })
  }

  const targetUid = req.params.userId
  if (!(await canReadPrivate(uid, targetUid))) {
    return res.status(403).json({ error: 'Unauthorized to read private data' })
  }

  const privatePayload = await getPrivatePayload(targetUid)
  if (!privatePayload) {
    return res.status(404).json({ error: 'No private data found' })
  }

  res.json(privatePayload)
})

app.patch('/api/me/private', verifyToken, async (req: AuthenticatedRequest, res) => {
  const uid = req.user?.uid
  if (!uid) {
    return res.status(401).json({ error: 'Missing authenticated UID' })
  }

  const updates = parsePrivateUpdates(req.body)
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid private fields provided' })
  }

  await updatePrivateDoc(uid, updates)
  res.json({ ok: true })
})

app.patch('/api/users/:userId/private', verifyToken, async (req: AuthenticatedRequest, res) => {
  const uid = req.user?.uid
  if (!uid) {
    return res.status(401).json({ error: 'Missing authenticated UID' })
  }

  const targetUid = req.params.userId
  if (!(await canUpdatePrivate(uid, targetUid))) {
    return res.status(403).json({ error: 'Unauthorized to update private data' })
  }

  const updates = parsePrivateUpdates(req.body)
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid private fields provided' })
  }

  await updatePrivateDoc(targetUid, updates)
  res.json({ ok: true })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(port, () => {
  console.log(`Secret Santa backend listening on http://localhost:${port}`)
})
