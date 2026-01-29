import { useState, useEffect } from "react"
import { DollarSign } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import type { Lead } from "@/features/leads/types/leads.types"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import { DashboardStats } from "./dashboard-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function InvestmentDashboard() {
    const { user } = useAuth()
    const [leads, setLeads] = useState<Lead[]>([])
    const [stats, setStats] = useState({
        total: 0,
        newLeads: 0,
        appointments: 0,
        pendingLegal: 0,
        pendingCommercial: 0
    })
    const [loading, setLoading] = useState(true)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Filter leads by category
    const categoryLeads = {
        nuevos: leads.filter(l => l.status === 'nuevo' && !l.closerFollowUp?.markedAsLost),
        activos: leads.filter(l => 
            ['contactado', 'no_contactado', 'contacto_no_efectivo', 'calificado'].includes(l.status) && 
            !l.closerFollowUp?.markedAsLost
        ),
        finalizados: leads.filter(l => l.status === 'rechazado' || l.closerFollowUp?.markedAsLost)
    }

    useEffect(() => {
        if (user) {
            loadMyLeads()
        }
    }, [user])

    const loadMyLeads = async () => {
        if (!user) return
        
        try {
            setLoading(true)
            const [myLeads, myStats] = await Promise.all([
                leadsService.getLeadsByExecutive(user.uid),
                leadsService.getExecutiveStats(user.uid)
            ])
            
            const filteredLeads = myLeads.filter(l => l.leadType === 'investment')
            setStats(myStats)
            
            const sortedLeads = [...filteredLeads].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
            setLeads(sortedLeads)
        } catch (error) {
            console.error("Error loading investment leads:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead)
        setIsDialogOpen(true)
    }

    const handleLeadUpdated = () => {
        loadMyLeads()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Leads de Inversión</h2>
                    <p className="text-muted-foreground">
                        Gestión de prospectos para inversión.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStats
                    title="Nuevos"
                    value={loading ? "..." : stats.newLeads}
                    description="Pendientes de primer contacto"
                    icon={DollarSign}
                    iconColor="text-accent"
                />
                <DashboardStats
                    title="Citas"
                    value={loading ? "..." : stats.appointments}
                    description="Con cita agendada"
                    icon={DollarSign}
                    iconColor="text-green-500"
                />
            </div>

            {/* Leads Table with Tabs */}
            <div className="space-y-6">
                <Tabs defaultValue="nuevos" className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Lista de Gestión</h3>
                        <TabsList className="bg-muted/50">
                            <TabsTrigger value="nuevos" className="relative">
                                Nuevos
                                {categoryLeads.nuevos.length > 0 && (
                                    <span className="ml-2 bg-accent text-white text-[10px] px-1.5 rounded-full">
                                        {categoryLeads.nuevos.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="activos">
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
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-muted-foreground">Cargando leads...</div>
                    ) : (
                        <>
                            <TabsContent value="nuevos" className="mt-0">
                                <LeadsTable leads={categoryLeads.nuevos} onLeadClick={handleLeadClick} />
                                {categoryLeads.nuevos.length === 0 && (
                                    <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                        No tienes prospectos nuevos asignados.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="activos" className="mt-0">
                                <LeadsTable leads={categoryLeads.activos} onLeadClick={handleLeadClick} />
                                {categoryLeads.activos.length === 0 && (
                                    <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                        No tienes prospectos en gestión activa.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="finalizados" className="mt-0">
                                <LeadsTable leads={categoryLeads.finalizados} onLeadClick={handleLeadClick} />
                                {categoryLeads.finalizados.length === 0 && (
                                    <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                        No hay prospectos finalizados.
                                    </div>
                                )}
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>

            <LeadDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                lead={selectedLead}
                onSuccess={handleLeadUpdated}
            />
        </div>
    )
}
