import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserSessions, type StoredSession } from '@/lib/sessions'

export function useSessions() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState<StoredSession[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        if (!user) {
            setSessions([])
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        try {
            const data = await getUserSessions(user.uid, 10)
            setSessions(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        refresh()
    }, [refresh])

    return { sessions, loading, error, refresh }
}
