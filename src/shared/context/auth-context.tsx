import { createContext, useContext, useEffect, useState } from "react"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "../types/user.types"

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
                // Filter out stale "local-" users from migration
                if (parsed.uid && parsed.uid.toString().startsWith('local-')) {
                    console.warn("AuthContext: Detected stale local user, clearing session.")
                    localStorage.removeItem(STORAGE_KEY)
                    setUser(null)
                } else {
                    setUser(parsed)
                }
            } catch (e) {
                console.error("Failed to parse stored user session")
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        setLoading(false)
    }, []) // Empty dependency array for mount only


    const login = async (email: string, password: string) => {
        setLoading(true)
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
            } else {
                throw new Error("Credenciales inválidas")
            }
        } catch (error: any) {
            console.warn("AuthContext: Firestore login failed", error)
            throw error
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
            const userDocRef = doc(db, "users", user.uid)
            await updateDoc(userDocRef, { status })
        } catch (error: any) {
            console.warn("AuthContext: Firestore status update failed", error)
        }
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
