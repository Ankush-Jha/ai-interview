import { createContext, useContext, useState, useEffect } from 'react'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile as fbUpdateProfile,
} from 'firebase/auth'
import { auth, googleProvider, githubProvider } from '../lib/firebase'
import { saveUserProfile, getUserProfile } from '../lib/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Build our user object from Firebase User
                let profile = await getUserProfile(firebaseUser.uid).catch(() => null)
                const appUser = {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || profile?.name || 'User',
                    email: firebaseUser.email,
                    avatar: (firebaseUser.displayName || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                    photoURL: firebaseUser.photoURL || null,
                    plan: profile?.plan || 'free',
                    createdAt: profile?.createdAt || new Date().toISOString(),
                }
                setUser(appUser)
            } else {
                setUser(null)
            }
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    // Email + Password Signup
    const signup = async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await fbUpdateProfile(cred.user, { displayName: name })
        // Save profile to Firestore
        await saveUserProfile(cred.user.uid, {
            name,
            email,
            plan: 'free',
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        })
        return cred.user
    }

    // Email + Password Login
    const login = async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        return cred.user
    }

    // Google Sign-In
    const loginWithGoogle = async () => {
        const cred = await signInWithPopup(auth, googleProvider)
        // Save/update profile on first login
        await saveUserProfile(cred.user.uid, {
            name: cred.user.displayName || 'User',
            email: cred.user.email,
            photoURL: cred.user.photoURL,
            plan: 'free',
        })
        return cred.user
    }

    // GitHub Sign-In
    const loginWithGithub = async () => {
        const cred = await signInWithPopup(auth, githubProvider)
        await saveUserProfile(cred.user.uid, {
            name: cred.user.displayName || 'User',
            email: cred.user.email,
            photoURL: cred.user.photoURL,
            plan: 'free',
        })
        return cred.user
    }

    // Logout
    const logout = async () => {
        await signOut(auth)
        setUser(null)
        // Clear interview session data on logout
        try { sessionStorage.removeItem('ai-interview-session') } catch { /* ignore */ }
    }

    // Update profile
    const updateUserProfileData = async (updates) => {
        if (!user) return
        const updated = { ...user, ...updates }
        setUser(updated)
        await saveUserProfile(user.uid, updates)
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signup,
            login,
            loginWithGoogle,
            loginWithGithub,
            logout,
            updateProfile: updateUserProfileData,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
