import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy, deleteDoc, onSnapshot, where } from "firebase/firestore"
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
    },

    async getDailyUserActivity(): Promise<{ userId: string; displayName: string; role: string; onlineMinutes: number; breakMinutes: number; lastStatus: string }[]> {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        try {
            // 1. Get all executives
            const usersQ = query(collection(db, "users"), where("role", "in", ["loan_executive", "investment_executive", "closer"]))
            const usersSnapshot = await getDocs(usersQ)
            const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))

            // 2. Get today's logs
            const logsQ = query(
                collection(db, "user_status_logs"),
                where("timestamp", ">=", today),
                orderBy("timestamp", "asc")
            )
            const logsSnapshot = await getDocs(logsQ)
            const logs = logsSnapshot.docs.map(doc => ({ 
                ...doc.data(), 
                timestamp: (doc.data().timestamp as any)?.toDate?.() || new Date()
            } as any))

            // 3. Calculate durations
            const activityMap: Record<string, { online: number; break: number; lastStatus: string }> = {}

            // Initialize map for all users
            users.forEach(u => {
                activityMap[u.uid] = { online: 0, break: 0, lastStatus: u.status || 'available' }
            })

            // Process logs per user
            const logsByUser: Record<string, any[]> = {}
            logs.forEach(log => {
                if (!logsByUser[log.userId]) logsByUser[log.userId] = []
                logsByUser[log.userId].push(log)
            })

            Object.keys(logsByUser).forEach(userId => {
                const userLogs = logsByUser[userId]
                
                // We need to calculate time buckets based on duration between logs
                // Simplification: Assume status holds until next log or "now"
                for (let i = 0; i < userLogs.length; i++) {
                    const currentLog = userLogs[i]
                    const nextLog = userLogs[i+1]
                    const endTime = nextLog ? nextLog.timestamp : new Date()
                    
                    const durationMinutes = (endTime.getTime() - currentLog.timestamp.getTime()) / 1000 / 60
                    
                    if (activityMap[userId]) {
                         const status = currentLog.status
                         if (status === 'available') {
                             activityMap[userId].online += durationMinutes
                         } else if (['lunch', 'break', 'bathroom'].includes(status)) {
                             activityMap[userId].break += durationMinutes
                         }
                         // 'meeting', 'end_shift' might be handled differently or ignored for "break" calculation
                    }
                }
            })

            return users.map(u => ({
                userId: u.uid,
                displayName: u.displayName || "Usuario",
                role: u.role,
                onlineMinutes: Math.round(activityMap[u.uid].online),
                breakMinutes: Math.round(activityMap[u.uid].break),
                lastStatus: u.status || 'available'
            }))

        } catch (error) {
            console.error("Error calculating daily activity:", error)
            return []
        }
    }
}
