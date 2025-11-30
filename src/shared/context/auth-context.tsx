import { createContext, useContext, useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "../types/user.types"

interface AuthContextType {
    user: UserProfile | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'f-crm-user-session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem(STORAGE_KEY)
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Failed to parse stored user session")
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        setLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        setLoading(true)
        try {
            // Query Firestore for user with matching email and password
            // Note: In production, password should be hashed. Here we compare plain text as requested.
            const q = query(
                collection(db, "users"), 
                where("email", "==", email),
                where("password", "==", password)
            )
            
            const snapshot = await getDocs(q)
            
            if (snapshot.empty) {
                throw new Error("Credenciales inválidas")
            }

            const userDoc = snapshot.docs[0]
            const userData = { uid: userDoc.id, ...userDoc.data() } as UserProfile
            
            // Remove password from state for security (optional, but good practice)
            // const { password: _, ...safeUser } = userData
            
            setUser(userData)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
        } finally {
            setLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login,
            logout,
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
