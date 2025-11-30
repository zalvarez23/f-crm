import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/auth-context"
import type { UserRole } from "../types/user.types"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading, isAuthenticated } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User authorized but doesn't have permission
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
