import { useState, useEffect } from "react"
import { PhoneCall } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import type { Lead } from "@/features/leads/types/leads.types"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import { DashboardStats } from "./dashboard-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ExecutiveDashboard() {
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
            const [myLeads, myStats] = await Promise.all([
                leadsService.getLeadsByExecutive(user.uid),
                leadsService.getExecutiveStats(user.uid)
            ])
            
            const filteredLeads = myLeads.filter(l => l.leadType === 'loan')
            setLeads(filteredLeads)
            setStats(myStats)
            
            setSelectedLead(current => {
                if (!current) return null
                return filteredLeads.find(l => l.id === current.id) || current
            })
        } catch (error) {
            console.error("Error loading leads:", error)
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
                    <h2 className="text-3xl font-bold tracking-tight">Mis Leads</h2>
                    <p className="text-muted-foreground">
                        Gestiona tus leads asignados de préstamos.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStats
                    title="Nuevos"
                    value={loading ? "..." : stats.newLeads}
                    description="Pendientes de primer contacto"
                    icon={PhoneCall}
                    iconColor="text-accent"
                />
                <DashboardStats
                    title="Citas"
                    value={loading ? "..." : stats.appointments}
                    description="Con cita agendada"
                    icon={PhoneCall}
                    iconColor="text-green-500"
                />
                <DashboardStats
                    title="Pte. Legal"
                    value={loading ? "..." : stats.pendingLegal}
                    description="En revisión legal"
                    icon={PhoneCall}
                    iconColor="text-blue-600"
                />
                <DashboardStats
                    title="Pte. Comercial"
                    value={loading ? "..." : stats.pendingCommercial}
                    description="En revisión comercial"
                    icon={PhoneCall}
                    iconColor="text-primary"
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
                        <div className="py-12 text-center text-muted-foreground">Cargando tus leads...</div>
                    ) : (
                        <>
                            <TabsContent value="nuevos" className="mt-0">
                                <LeadsTable leads={categoryLeads.nuevos} onLeadClick={handleLeadClick} />
                                {categoryLeads.nuevos.length === 0 && (
                                    <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                        No tienes leads nuevos asignados.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="activos" className="mt-0">
                                <LeadsTable leads={categoryLeads.activos} onLeadClick={handleLeadClick} />
                                {categoryLeads.activos.length === 0 && (
                                    <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                        No tienes leads en seguimiento activo.
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="finalizados" className="mt-0">
                                <LeadsTable leads={categoryLeads.finalizados} onLeadClick={handleLeadClick} />
                                {categoryLeads.finalizados.length === 0 && (
                                    <div className="py-12 text-center border rounded-md border-dashed text-muted-foreground">
                                        No hay leads finalizados (rechazados o perdidos).
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
