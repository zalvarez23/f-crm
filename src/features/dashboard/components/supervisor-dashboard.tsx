import { useState, useEffect } from "react"
import { Users, PhoneCall, Clock, Trash2, Loader2 } from "lucide-react"
import { usersService } from "@/features/users/services/users.service"
import { leadsService } from "@/features/leads/services/leads.service"
import type { UserProfile, UserStatus } from "@/shared/types/user.types"
import { DashboardStats } from "./dashboard-stats"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function SupervisorDashboard() {
    const [executives, setExecutives] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        activeExecutives: 0,
        totalLeads: 0,
        pendingLeads: 0
    })
    const [isResetting, setIsResetting] = useState(false)

    useEffect(() => {
        // Subscribe to real-time user updates
        const unsubscribe = usersService.subscribeToUsers((allUsers) => {
            const execs = allUsers.filter(u => u.role === 'loan_executive' || u.role === 'investment_executive')
            setExecutives(execs)
            setStats(prev => ({ ...prev, activeExecutives: execs.length }))
            setLoading(false)
        })

        // Initial load for leads stats
        loadLeadsStats()

        return () => unsubscribe()
    }, [])

    const loadLeadsStats = async () => {
        try {
            const leadsStats = await leadsService.getLeadsStats()
            setStats(prev => ({
                ...prev,
                totalLeads: leadsStats.totalLeads,
                pendingLeads: leadsStats.pendingLeads
            }))
        } catch (error) {
            console.error("Error loading leads stats:", error)
        }
    }

    const handleResetDatabase = async () => {
        const confirmResult = window.confirm(
            "¿Estás seguro de que deseas eliminar TODOS los leads? Esta acción no se puede deshacer."
        )
        
        if (!confirmResult) return

        try {
            setIsResetting(true)
            await leadsService.deleteAllLeads()
            await loadLeadsStats()
            alert("Base de datos de leads reiniciada exitosamente.")
        } catch (error) {
            console.error("Error resetting database:", error)
            alert("Error al reiniciar la base de datos.")
        } finally {
            setIsResetting(false)
        }
    }

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    const statusConfig: Record<UserStatus, { label: string, color: string, bg: string, text: string }> = {
        available: { label: 'Disponible', color: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
        bathroom: { label: 'Baño', color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
        lunch: { label: 'Almuerzo', color: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
        break: { label: 'Pausa Activa', color: 'bg-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
        meeting: { label: 'Reunión', color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
        end_shift: { label: 'Fin de Turno', color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Team and lead management overview
                    </p>
                </div>
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleResetDatabase}
                    disabled={isResetting}
                    className="flex items-center gap-2"
                >
                    {isResetting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    Reiniciar Base de Datos
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DashboardStats
                    title="Active Executives"
                    value={loading ? "..." : stats.activeExecutives}
                    description="Team members assigned"
                    icon={Users}
                    iconColor="text-blue-500"
                />
                <DashboardStats
                    title="Total Leads"
                    value={loading ? "..." : stats.totalLeads}
                    description="All leads in system"
                    icon={PhoneCall}
                    iconColor="text-green-500"
                />
                <DashboardStats
                    title="Pending Leads"
                    value={loading ? "..." : stats.pendingLeads}
                    description="Awaiting first contact"
                    icon={Clock}
                    iconColor="text-orange-500"
                />
            </div>

            {/* Executives List */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">My Team</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p>Loading team...</p>
                    ) : executives.length > 0 ? (
                        executives.map(exec => {
                            const status = exec.status || 'available'
                            const config = statusConfig[status]
                            
                            return (
                                <div key={exec.uid} className="rounded-xl border shadow-sm p-4 bg-card transition-all hover:shadow-md">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border shadow-sm">
                                                <AvatarImage src={exec.photoURL} alt={exec.displayName} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                    {getInitials(exec.displayName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <h4 className="font-bold truncate">{exec.displayName || "Usuario"}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{exec.email}</p>
                                            </div>
                                        </div>
                                        <Badge 
                                            variant="outline" 
                                            className={`flex items-center gap-1.5 px-2 py-0.5 border-none shadow-none font-bold text-[10px] uppercase tracking-wider ${config.bg} ${config.text}`}
                                        >
                                            <div className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
                                            {config.label}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-muted-foreground col-span-full text-center py-8">No hay ejecutivos registrados.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
