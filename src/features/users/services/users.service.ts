import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile, UserRole } from "@/shared/types/user.types"

export interface CreateUserData {
    email: string
    password?: string
    displayName: string
    role: UserRole
}

export const usersService = {
    async getAll(): Promise<UserProfile[]> {
        
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
        } catch (error: any) {
            console.warn("usersService: Failed to fetch users from Firestore", error)
            throw error
        }
    },

    subscribeToUsers(callback: (users: UserProfile[]) => void) {
        let unsubscribeFirestore: (() => void) | undefined

        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
            unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
                callback(users)
            }, (error) => {
                console.warn("usersService: Firestore subscription failed", error)
            })
        } catch (error) {
            console.warn("usersService: Could not initialize Firestore subscription", error)
        }

        return () => {
            if (unsubscribeFirestore) unsubscribeFirestore()
        }
    },

    async create(userData: CreateUserData): Promise<void> {

        try {
            await addDoc(collection(db, "users"), {
                ...userData,
                createdAt: serverTimestamp()
            })
        } catch (error: any) {
            console.warn("usersService: Failed to create user in Firestore", error)
            throw error
        }
    },

    async update(uid: string, data: Partial<UserProfile>): Promise<void> {

        try {
            const docRef = doc(db, "users", uid)
            await updateDoc(docRef, data)
        } catch (error: any) {
            console.warn("usersService: Failed to update user in Firestore", error)
            throw error
        }
    },

    async delete(uid: string): Promise<void> {

        try {
            await deleteDoc(doc(db, "users", uid))
        } catch (error: any) {
            console.warn("usersService: Failed to delete user in Firestore", error)
            throw error
        }
    },
    
    // Helper to check if email exists (optional validation)
    async emailExists(): Promise<boolean> {
        // Implementation left for future if needed
        return false
    }
}
