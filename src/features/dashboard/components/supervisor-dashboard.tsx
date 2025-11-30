import { useState, useEffect } from "react"
import { Users, PhoneCall, Clock } from "lucide-react"
import { usersService } from "@/features/users/services/users.service"
import { leadsService } from "@/features/leads/services/leads.service"
import type { UserProfile } from "@/shared/types/user.types"
import { DashboardStats } from "./dashboard-stats"

export function SupervisorDashboard() {
    const [executives, setExecutives] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        activeExecutives: 0,
        totalLeads: 0,
        pendingLeads: 0
    })

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            // Load executives
            const allUsers = await usersService.getAll()
            const execs = allUsers.filter(u => u.role === 'executive')
            setExecutives(execs)

            // Load leads stats
            const leadsStats = await leadsService.getLeadsStats()
            
            setStats({
                activeExecutives: execs.length,
                totalLeads: leadsStats.totalLeads,
                pendingLeads: leadsStats.pendingLeads
            })
        } catch (error) {
            console.error("Error loading dashboard data:", error)
        } finally {
            setLoading(false)
        }
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
                        executives.map(exec => (
                            <div key={exec.uid} className="rounded-lg border p-4">
                                <div className="space-y-2">
                                    <h4 className="font-semibold">{exec.displayName}</h4>
                                    <p className="text-sm text-muted-foreground">{exec.email}</p>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-muted-foreground">Active</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground col-span-full">No executives registered.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
