import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DocumentAnalysis, StoredDocument, Topic } from '@/types/document'

function userDocsCollection(userId: string) {
    return collection(db, 'users', userId, 'documents')
}

/** Save a document analysis to Firestore. Returns the new document ID. */
export async function saveDocument(
    userId: string,
    analysis: DocumentAnalysis,
    file: File
): Promise<string> {
    const docRef = await addDoc(userDocsCollection(userId), {
        userId,
        title: analysis.title,
        summary: analysis.summary,
        topics: analysis.topics,
        keyTerms: analysis.keyTerms,
        estimatedDifficulty: analysis.estimatedDifficulty,
        totalPages: analysis.totalPages,
        rawText: analysis.rawText,
        fileName: file.name,
        fileSize: file.size,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    })
    return docRef.id
}

/** Fetch all documents for a user, sorted by newest first. */
export async function getUserDocuments(userId: string): Promise<StoredDocument[]> {
    const q = query(userDocsCollection(userId), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((d) => {
        const data = d.data()
        return {
            id: d.id,
            userId: data.userId,
            title: data.title,
            summary: data.summary,
            topics: (data.topics || []) as Topic[],
            keyTerms: (data.keyTerms || []) as string[],
            estimatedDifficulty: data.estimatedDifficulty,
            totalPages: data.totalPages,
            rawText: data.rawText,
            fileName: data.fileName,
            fileSize: data.fileSize,
            createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
            updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
        } as StoredDocument
    })
}

/** Fetch a single document by ID. */
export async function getDocument(
    userId: string,
    docId: string
): Promise<StoredDocument | null> {
    const docRef = doc(db, 'users', userId, 'documents', docId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null

    const data = snap.data()
    return {
        id: snap.id,
        userId: data.userId,
        title: data.title,
        summary: data.summary,
        topics: (data.topics || []) as Topic[],
        keyTerms: (data.keyTerms || []) as string[],
        estimatedDifficulty: data.estimatedDifficulty,
        totalPages: data.totalPages,
        rawText: data.rawText,
        fileName: data.fileName,
        fileSize: data.fileSize,
        createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
    } as StoredDocument
}

/** Delete a document. */
export async function deleteDocument(userId: string, docId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'documents', docId)
    await deleteDoc(docRef)
}
