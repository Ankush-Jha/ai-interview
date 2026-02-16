import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { InterviewSession } from '@/types/interview'

function userSessionsCollection(userId: string) {
    return collection(db, 'users', userId, 'sessions')
}

/** Save a completed interview session. Returns the Firestore doc ID. */
export async function saveSession(
    userId: string,
    session: InterviewSession
): Promise<string> {
    const docRef = await addDoc(userSessionsCollection(userId), {
        ...session,
        createdAt: serverTimestamp(),
    })
    return docRef.id
}

export interface StoredSession extends InterviewSession {
    firestoreId: string
    createdAt: Date
}

/** Fetch sessions for a user, newest first, with optional limit. */
export async function getUserSessions(
    userId: string,
    maxResults = 20
): Promise<StoredSession[]> {
    const q = query(
        userSessionsCollection(userId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
    )
    const snapshot = await getDocs(q)

    return snapshot.docs.map((d) => {
        const data = d.data()
        return {
            ...data,
            firestoreId: d.id,
            createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
        } as StoredSession
    })
}

/** Fetch a single session. */
export async function getSession(
    userId: string,
    sessionId: string
): Promise<StoredSession | null> {
    const docRef = doc(db, 'users', userId, 'sessions', sessionId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null

    const data = snap.data()
    return {
        ...data,
        firestoreId: snap.id,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
    } as StoredSession
}
