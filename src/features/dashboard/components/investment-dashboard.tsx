import { useState, useEffect } from "react"
import { DollarSign } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import type { Lead } from "@/features/leads/types/leads.types"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import { DashboardStats } from "./dashboard-stats"

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

    useEffect(() => {
        if (user) {
            loadMyLeads()
        }
    }, [user])

    const loadMyLeads = async () => {
        if (!user) return
        
        try {
            setLoading(true)
            // Get leads assigned to this executive
            const [myLeads, myStats] = await Promise.all([
                leadsService.getLeadsByExecutive(user.uid),
                leadsService.getExecutiveStats(user.uid)
            ])
            
            const filteredLeads = myLeads.filter(l => l.leadType === 'investment')
            setStats(myStats)
            
            // For Investment Executive, we sort by amount descending
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
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Leads de Inversión</h2>
                <p className="text-muted-foreground">
                    Gestión de prospectos para inversión
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStats
                    title="Nuevos"
                    value={loading ? "..." : stats.newLeads}
                    description="Leads pendientes de primer contacto"
                    icon={DollarSign}
                    iconColor="text-accent"
                />
                <DashboardStats
                    title="Citas"
                    value={loading ? "..." : stats.appointments}
                    description="Leads con cita agendada"
                    icon={DollarSign}
                    iconColor="text-green-500"
                />
                <DashboardStats
                    title="Pte. Legal"
                    value={loading ? "..." : stats.pendingLegal}
                    description="A la espera de revisión legal"
                    icon={DollarSign}
                    iconColor="text-blue-600"
                />
                <DashboardStats
                    title="Pte. Comercial"
                    value={loading ? "..." : stats.pendingCommercial}
                    description="A la espera de revisión comercial"
                    icon={DollarSign}
                    iconColor="text-primary"
                />
            </div>

            {/* Leads Table */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Lista de Leads</h3>
                {loading ? (
                    <p>Cargando leads...</p>
                ) : (
                    <LeadsTable leads={leads} onLeadClick={handleLeadClick} />
                )}
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
