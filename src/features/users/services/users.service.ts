import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore"
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
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
    },

    async create(userData: CreateUserData): Promise<void> {
        // Simple creation in Firestore
        // We store the password directly as requested for this custom auth implementation
        await addDoc(collection(db, "users"), {
            email: userData.email,
            password: userData.password, // Storing password for custom auth
            displayName: userData.displayName,
            role: userData.role,
            createdAt: serverTimestamp()
        })
    },

    async update(uid: string, data: Partial<UserProfile>): Promise<void> {
        const docRef = doc(db, "users", uid)
        await updateDoc(docRef, data)
    },

    async delete(uid: string): Promise<void> {
        await deleteDoc(doc(db, "users", uid))
    },
    
    // Helper to check if email exists (optional validation)
    async emailExists(): Promise<boolean> {
        // Implementation left for future if needed
        return false
    }
}
