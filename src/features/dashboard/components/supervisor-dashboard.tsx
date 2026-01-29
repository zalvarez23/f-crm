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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

export function SupervisorDashboard() {
    // const [executives, setExecutives] = useState<UserProfile[]>([]) // Removed
    const [allLeads, setAllLeads] = useState<Lead[]>([]) 
    const [usersMap, setUsersMap] = useState<Record<string, string>>({}) // Map UID to DisplayName
    const [loading, setLoading] = useState(true)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null) 
    const [isDialogOpen, setIsDialogOpen] = useState(false) 
    const [stats, setStats] = useState({
        activeExecutives: 0,
        totalLeads: 0,
        pendingLeads: 0
    })
    const [analyticsData, setAnalyticsData] = useState<any>(null)
    const [performanceData, setPerformanceData] = useState<any[]>([])
    const [isResetting, setIsResetting] = useState(false)
    const [executiveFilter, setExecutiveFilter] = useState<string>("all")

    // Get unique executives from usersMap for the filter
    const uniqueExecutives = Object.entries(usersMap)
        .filter(([uid]) => allLeads.some(lead => lead.assignedTo === uid))
        .map(([uid, name]) => ({ uid, name }))
        .sort((a, b) => a.name.localeCompare(b.name))

    // Enrich and Categorize Leads
    const enrichedLeads = allLeads
        .map(lead => ({
            ...lead,
            assignedToName: lead.assignedTo ? (usersMap[lead.assignedTo] || "Asignado") : null
        }))
        .filter(lead => executiveFilter === "all" || lead.assignedTo === executiveFilter)

    const categoryLeads = {
        nuevos: enrichedLeads.filter(l => l.status === 'nuevo' && !l.closerFollowUp?.markedAsLost),
        activos: enrichedLeads.filter(l => 
            ['contactado', 'no_contactado', 'contacto_no_efectivo', 'calificado'].includes(l.status) && 
            !l.closerFollowUp?.markedAsLost
        ),
        finalizados: enrichedLeads.filter(l => l.status === 'rechazado' || l.closerFollowUp?.markedAsLost)
    }

    useEffect(() => {
        loadLeadsStats()
    }, [])

    const loadLeadsStats = async () => {
        try {
            const [leadsStats, leads, allUsers, globalStats, performance] = await Promise.all([
                leadsService.getLeadsStats(),
                leadsService.getAllLeads(),
                usersService.getAll(),
                leadsService.getGlobalStats(),
                usersService.getDailyUserActivity()
            ])

            // Create users map
            const uMap: Record<string, string> = {}
            allUsers.forEach(u => uMap[u.uid] = u.displayName || "Usuario")
            setUsersMap(uMap)

            setAllLeads(leads)
            setStats({
                activeExecutives: allUsers.filter(u => ['loan_executive', 'investment_executive', 'closer'].includes(u.role)).length,
                totalLeads: leadsStats.totalLeads,
                pendingLeads: leadsStats.pendingLeads
            })
            setAnalyticsData(globalStats)
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
        loadLeadsStats() 
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
                    <TabsTrigger value="overview">Base de Datos Global</TabsTrigger>
                    <TabsTrigger value="analytics">Analítica</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <DashboardStats
                            title="Asesores Activos"
                            value={loading ? "..." : stats.activeExecutives}
                            description="Personal asignado a gestión"
                            icon={Users}
                            iconColor="text-blue-600"
                        />
                        <DashboardStats
                            title="Leads Totales"
                            value={loading ? "..." : stats.totalLeads}
                            description="En toda la base de datos"
                            icon={PhoneCall}
                            iconColor="text-accent"
                        />
                        <DashboardStats
                            title="Leads Pendientes"
                            value={loading ? "..." : stats.pendingLeads}
                            description="Sin primer contacto"
                            icon={Clock}
                            iconColor="text-primary"
                        />
                    </div>

                    {/* All Leads Table with Sub-Tabs */}
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-xl font-semibold">Base de Datos de Leads Global</h3>
                            
                            <div className="flex items-center gap-2 min-w-[240px]">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Select value={executiveFilter} onValueChange={setExecutiveFilter}>
                                    <SelectTrigger className="w-full bg-background">
                                        <SelectValue placeholder="Filtrar por Ejecutivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los Ejecutivos</SelectItem>
                                        {uniqueExecutives.map(exec => (
                                            <SelectItem key={exec.uid} value={exec.uid}>
                                                {exec.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Tabs defaultValue="activos" className="w-full">
                            <TabsList className="bg-muted/50 mb-4">
                                <TabsTrigger value="nuevos">
                                    Nuevos
                                    {categoryLeads.nuevos.length > 0 && (
                                        <span className="ml-2 bg-accent text-white text-[10px] px-1.5 rounded-full">
                                            {categoryLeads.nuevos.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="activos" className="relative">
                                    En Seguimiento
                                    {categoryLeads.activos.length > 0 && (
                                        <span className="ml-2 bg-green-500 text-white text-[10px] px-1.5 rounded-full">
                                            {categoryLeads.activos.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="finalizados">
                                    Finalizados
                                </TabsTrigger>
                            </TabsList>

                            {loading ? (
                                <div className="py-12 text-center text-muted-foreground border rounded-md border-dashed">
                                    Cargando base de datos global...
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="nuevos" className="mt-0">
                                        <LeadsTable leads={categoryLeads.nuevos} onLeadClick={handleLeadClick} />
                                        {categoryLeads.nuevos.length === 0 && (
                                            <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                                No hay leads nuevos en el sistema.
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="activos" className="mt-0">
                                        <LeadsTable leads={categoryLeads.activos} onLeadClick={handleLeadClick} />
                                        {categoryLeads.activos.length === 0 && (
                                            <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                                No hay leads en seguimiento activo.
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="finalizados" className="mt-0">
                                        <LeadsTable leads={categoryLeads.finalizados} onLeadClick={handleLeadClick} />
                                        {categoryLeads.finalizados.length === 0 && (
                                            <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                                No hay registros finalizados.
                                            </div>
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>
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
