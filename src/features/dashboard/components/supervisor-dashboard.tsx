import { useState, useEffect } from "react"
import { Users, PhoneCall, Clock, Trash2, Loader2 } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import { usersService } from "@/features/users/services/users.service"
import type { Lead } from "@/features/leads/types/leads.types" // Added import
import { DashboardStats } from "./dashboard-stats"
import { LeadsTable } from "@/features/leads/components/leads-table" // Added import
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog" // Added import
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeadsByStatusChart } from "./analytics/leads-by-status-chart"
import { LeadsByTypeChart } from "./analytics/leads-by-type-chart"
import { PipelineStageChart } from "./analytics/pipeline-stage-chart"
import { LeadsBySubstatusChart } from "./analytics/leads-by-substatus-chart"
import { ExecutivePerformanceTable } from "./analytics/executive-performance-table"
import { toast } from "sonner"

export function SupervisorDashboard() {
    // const [executives, setExecutives] = useState<UserProfile[]>([]) // Removed
    const [allLeads, setAllLeads] = useState<Lead[]>([]) // Added state for leads
    const [loading, setLoading] = useState(true)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null) // For dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false) // For dialog
    const [stats, setStats] = useState({
        activeExecutives: 0,
        totalLeads: 0,
        pendingLeads: 0
    })
    const [analyticsData, setAnalyticsData] = useState<any>(null)
    const [performanceData, setPerformanceData] = useState<any[]>([])
    const [isResetting, setIsResetting] = useState(false)

    useEffect(() => {
        // Subscribe only to refresh leads stats if needed (usually handled by events)
        loadLeadsStats()
        // const unsubscribe = usersService.subscribeToUsers... removed as we don't display users list here anymore
    }, [])

    const loadLeadsStats = async () => {
        try {
            const leadsStats = await leadsService.getLeadsStats()
            // Also fetch actual leads for the table
            const leads = await leadsService.getAllLeads()
            setAllLeads(leads)
            
            setStats(prev => ({
                ...prev,
                totalLeads: leadsStats.totalLeads,
                pendingLeads: leadsStats.pendingLeads
            }))

            // Fetch comprehensive analytics
            const globalStats = await leadsService.getGlobalStats()
            setAnalyticsData(globalStats)

            // Fetch performance data
            const performance = await usersService.getDailyUserActivity()
            setPerformanceData(performance)
        } catch (error) {
            console.error("Error loading leads stats:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead)
        setIsDialogOpen(true)
    }

    const handleLeadUpdated = () => {
        loadLeadsStats() // Refresh data
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
            toast.success("Base de datos de leads reiniciada exitosamente.")
        } catch (error) {
            console.error("Error resetting database:", error)
            toast.error("Error al reiniciar la base de datos.")
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Vista general del equipo y gestión de leads
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

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visión General</TabsTrigger>
                    <TabsTrigger value="analytics">Analítica</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <DashboardStats
                            title="Ejecutivos Activos"
                            value={loading ? "..." : stats.activeExecutives}
                            description="Miembros del equipo asignados"
                            icon={Users}
                            iconColor="text-blue-600"
                        />
                        <DashboardStats
                            title="Leads Totales"
                            value={loading ? "..." : stats.totalLeads}
                            description="Todos los leads en el sistema"
                            icon={PhoneCall}
                            iconColor="text-accent"
                        />
                        <DashboardStats
                            title="Leads Pendientes"
                            value={loading ? "..." : stats.pendingLeads}
                            description="A la espera de primer contacto"
                            icon={Clock}
                            iconColor="text-primary"
                        />
                    </div>

                    {/* All Leads Table */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Base de Datos de Leads Global</h3>
                        <div className="rounded-md border p-4">
                            {loading ? (
                                <p>Loading leads...</p>
                            ) : (
                                <LeadsTable leads={allLeads} onLeadClick={handleLeadClick} />
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    {analyticsData ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <LeadsByStatusChart data={analyticsData.byStatus} />
                            <LeadsByTypeChart data={analyticsData.byType} />
                            <PipelineStageChart 
                                legalStats={analyticsData.legalStats} 
                                commercialStats={analyticsData.commercialStats} 
                            />
                            <LeadsBySubstatusChart data={analyticsData.bySubstatus} />
                            <ExecutivePerformanceTable data={performanceData} />
                        </div>
                    ) : (
                         <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
                            {loading ? "Calculando estadísticas..." : "No hay datos analíticos disponibles"}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <LeadDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                lead={selectedLead}
                onSuccess={handleLeadUpdated}
            />
        </div>
    )
}
