import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserDocuments, deleteDocument } from '@/lib/documents'
import type { StoredDocument } from '@/types/document'

export function useDocuments() {
    const { user } = useAuth()
    const [documents, setDocuments] = useState<StoredDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        if (!user) {
            setDocuments([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const docs = await getUserDocuments(user.uid)
            setDocuments(docs)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        refresh()
    }, [refresh])

    const remove = useCallback(
        async (docId: string) => {
            if (!user) return
            await deleteDocument(user.uid, docId)
            setDocuments((prev) => prev.filter((d) => d.id !== docId))
        },
        [user]
    )

    return { documents, loading, error, refresh, remove }
}
