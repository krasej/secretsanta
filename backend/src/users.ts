import type express from 'express'
import { getAuth as adminGetAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { getFirestore as adminGetFirestore, type DocumentData } from 'firebase-admin/firestore'

function getAuth() {
  return adminGetAuth()
}

function getDb() {
  return adminGetFirestore()
}

export interface AuthenticatedRequest extends express.Request {
  user?: DecodedIdToken
}

export type PrivateUserData = {
  address?: string | null
}

export function safeProfile(userId: string, data: DocumentData | undefined) {
  if (!data) {
    return null
  }

  return {
    id: userId,
    name: data.name ?? null,
    discordName: data.discordName ?? null,
    presents: Array.isArray(data.presents) ? data.presents : [],
    role: data.role ?? 'user',
    hasSecretSanta: data.hasSecretSanta ?? false,
    excludedReceiverIds: Array.isArray(data.excludedReceiverIds)
      ? data.excludedReceiverIds.filter((item) => typeof item === 'string')
      : [],
  }
}

export async function getUserDoc(userId: string) {
  const snapshot = await getDb().collection('users').doc(userId).get()
  return snapshot.exists ? snapshot.data() : null
}

export async function getPrivateDoc(userId: string) {
  const snapshot = await getDb().collection('userPrivate').doc(userId).get()
  return snapshot.exists ? (snapshot.data() as PrivateUserData) : null
}

export async function getPrivatePayload(targetUid: string) {
  const privateData = await getPrivateDoc(targetUid)

  if (privateData) {
    return {
      id: targetUid,
      address: privateData.address ?? null,
    }
  }

  const fallback = await getUserDoc(targetUid)
  return fallback
    ? {
        id: targetUid,
        address: fallback.address ?? null,
      }
    : null
}

export async function verifyToken(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' })
  }

  const idToken = authHeader.split(' ')[1]
  try {
    req.user = await getAuth().verifyIdToken(idToken)
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid Firebase ID token' })
  }
}

export async function canReadPrivate(requesterUid: string, targetUid: string) {
  if (requesterUid === targetUid) {
    return true
  }

  const requester = await getUserDoc(requesterUid)
  if (!requester) {
    return false
  }

  if (requester.role === 'admin') {
    return true
  }

  const target = await getUserDoc(targetUid)
  if (!target) {
    return false
  }

  return requester.receiver === target.name
}

export async function canUpdatePrivate(requesterUid: string, targetUid: string) {
  if (requesterUid === targetUid) {
    return true
  }

  const requester = await getUserDoc(requesterUid)
  return requester?.role === 'admin'
}

export async function updatePrivateDoc(userId: string, updates: PrivateUserData) {
  return getDb().collection('userPrivate').doc(userId).set(updates, { merge: true })
}

export function parsePrivateUpdates(body: unknown): PrivateUserData {
  const updates: PrivateUserData = {}
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const data = body as Record<string, unknown>
    if (data.address === null || typeof data.address === 'string') {
      updates.address = data.address as string | null
    }
  }
  return updates
}
