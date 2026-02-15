import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    updateProfile,
    type User,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

export async function signUpWithEmail(
    email: string,
    password: string,
    displayName: string
): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(user, { displayName })
    return user
}

export async function signInWithEmail(
    email: string,
    password: string
): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return user
}

export async function signInWithGoogle(): Promise<User> {
    const { user } = await signInWithPopup(auth, googleProvider)
    return user
}

export async function signOut(): Promise<void> {
    await firebaseSignOut(auth)
}
