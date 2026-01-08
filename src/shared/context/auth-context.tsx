import { createContext, useContext, useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "../types/user.types"
import { localDb } from "../lib/local-db"

interface AuthContextType {
    user: UserProfile | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    updateStatus: (status: UserProfile['status']) => Promise<void>
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'f-crm-user-session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 1. Initial load from localStorage only on mount
        const storedUser = localStorage.getItem(STORAGE_KEY)
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser)
                setUser(parsed)
            } catch (e) {
                console.error("Failed to parse stored user session")
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        setLoading(false)
    }, []) // Empty dependency array for mount only

    useEffect(() => {
        // 2. Listener for local updates (cross-tab/component sync)
        if (!user) return

        const handleLocalUpdate = (e: any) => {
            const users = e.detail as UserProfile[]
            const refreshed = users.find(u => u.uid === user.uid)
            
            // Critical check: only update if status actually changed
            if (refreshed && refreshed.status !== user.status) {
                console.log("AuthContext: Syncing status from local event")
                const updated = { ...user, status: refreshed.status }
                setUser(updated)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            }
        }

        window.addEventListener('local-db-update' as any, handleLocalUpdate)
        return () => window.removeEventListener('local-db-update' as any, handleLocalUpdate)
    }, [user]) // Re-run listener when user identity (or status) changes

    const login = async (email: string, password: string) => {
        setLoading(true)
        try {
            // Priority 1: Try Firestore if not in forced Local Mode
            if (!localDb.isLocalMode()) {
                try {
                    const q = query(
                        collection(db, "users"), 
                        where("email", "==", email),
                        where("password", "==", password)
                    )
                    
                    const snapshot = await getDocs(q)
                    
                    if (!snapshot.empty) {
                        const userDoc = snapshot.docs[0]
                        const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile
                        setUser(userData)
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
                        return
                    }
                } catch (error: any) {
                    console.warn("AuthContext: Firestore login failed, potentially permissions", error)
                    if (error.code === 'permission-denied') {
                        console.info("AuthContext: Permission denied, enabling Local Mode bypass")
                        localDb.setLocalMode(true)
                    }
                }
            }

            // Priority 2: Fallback to Local Mock DB
            const mockUser = localDb.login(email, password)
            if (mockUser) {
                setUser(mockUser)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser))
            } else {
                throw new Error("Credenciales inválidas")
            }
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    const updateStatus = async (status: UserProfile['status']) => {
        if (!user) return
        
        // Optimistic UI update
        setUser(prev => {
            if (!prev) return null
            const updated = { ...prev, status }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            return updated
        })

        try {
            // Try Firestore update if not in forced Local Mode
            if (!localDb.isLocalMode()) {
                const userDocRef = doc(db, "users", user.uid)
                await updateDoc(userDocRef, { status })
            }
        } catch (error: any) {
            console.warn("AuthContext: Firestore status update failed", error)
            if (error.code === 'permission-denied') {
                localDb.setLocalMode(true)
            }
        }

        // Always update Local Mock DB for persistence in local mode
        localDb.updateUserStatus(user.uid, status as any)
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login,
            logout,
            updateStatus,
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
