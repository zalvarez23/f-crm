import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile, UserRole } from "@/shared/types/user.types"
import { localDb } from "@/shared/lib/local-db"

export interface CreateUserData {
    email: string
    password?: string
    displayName: string
    role: UserRole
}

export const usersService = {
    async getAll(): Promise<UserProfile[]> {
        if (localDb.isLocalMode()) return localDb.getUsers()
        
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
            const snapshot = await getDocs(q)
            return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
        } catch (error: any) {
            console.warn("usersService: Failed to fetch users from Firestore, using local mock data", error)
            if (error.code === 'permission-denied') localDb.setLocalMode(true)
            return localDb.getUsers()
        }
    },

    subscribeToUsers(callback: (users: UserProfile[]) => void) {
        let unsubscribeFirestore: (() => void) | undefined

        // Try Firestore subscription only if not in forced Local Mode
        if (!localDb.isLocalMode()) {
            try {
                const q = query(collection(db, "users"), orderBy("createdAt", "desc"))
                unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
                    callback(users)
                }, (error) => {
                    console.warn("usersService: Firestore subscription failed", error)
                    if (error.code === 'permission-denied') localDb.setLocalMode(true)
                })
            } catch (error) {
                console.warn("usersService: Could not initialize Firestore subscription", error)
            }
        }

        // Always subscribe to local events as a fallback/parallel source
        const handleLocalUpdate = (e: any) => {
            callback(e.detail)
        }
        window.addEventListener('local-db-update' as any, handleLocalUpdate)
        
        // Initial local data send
        callback(localDb.getUsers())

        return () => {
            if (unsubscribeFirestore) unsubscribeFirestore()
            window.removeEventListener('local-db-update' as any, handleLocalUpdate)
        }
    },

    async create(userData: CreateUserData): Promise<void> {
        // Priority 1: Local Mode
        if (localDb.isLocalMode()) {
            const users = localDb.getUsers()
            const newUser: UserProfile = {
                uid: `local-${Date.now()}`,
                ...userData,
                status: 'available',
                createdAt: new Date()
            }
            users.push(newUser)
            localDb.saveUsers(users)
            return
        }

        try {
            await addDoc(collection(db, "users"), {
                ...userData,
                createdAt: serverTimestamp()
            })
        } catch (error: any) {
            console.warn("usersService: Failed to create user in Firestore", error)
            if (error.code === 'permission-denied') {
                localDb.setLocalMode(true)
                return this.create(userData)
            }
            throw error
        }
    },

    async update(uid: string, data: Partial<UserProfile>): Promise<void> {
        // Priority 1: Local Mode
        if (localDb.isLocalMode()) {
            const users = localDb.getUsers()
            const index = users.findIndex(u => u.uid === uid)
            if (index !== -1) {
                users[index] = { ...users[index], ...data }
                localDb.saveUsers(users)
            }
            return
        }

        try {
            const docRef = doc(db, "users", uid)
            await updateDoc(docRef, data)
        } catch (error: any) {
            console.warn("usersService: Failed to update user in Firestore", error)
            if (error.code === 'permission-denied') {
                localDb.setLocalMode(true)
                return this.update(uid, data)
            }
            throw error
        }
    },

    async delete(uid: string): Promise<void> {
        // Priority 1: Local Mode
        if (localDb.isLocalMode()) {
            const users = localDb.getUsers()
            const filtered = users.filter(u => u.uid !== uid)
            localDb.saveUsers(filtered)
            return
        }

        try {
            await deleteDoc(doc(db, "users", uid))
        } catch (error: any) {
            console.warn("usersService: Failed to delete user in Firestore", error)
            if (error.code === 'permission-denied') {
                localDb.setLocalMode(true)
                return this.delete(uid)
            }
            throw error
        }
    },
    
    // Helper to check if email exists (optional validation)
    async emailExists(): Promise<boolean> {
        // Implementation left for future if needed
        return false
    }
}
