import { useState, useEffect } from "react"
import { PhoneCall } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import type { Lead } from "@/features/leads/types/leads.types"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import { DashboardStats } from "./dashboard-stats"

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

    console.log('🎯 ExecutiveDashboard render - user:', user, 'leads count:', leads.length, 'loading:', loading)

    useEffect(() => {
        console.log('🔄 ExecutiveDashboard useEffect triggered, user:', user)
        if (user) {
            console.log('✅ User exists, calling loadMyLeads()')
            loadMyLeads()
        } else {
            console.log('❌ No user, skipping loadMyLeads()')
        }
    }, [user])

    const loadMyLeads = async () => {
        if (!user) return
        
        try {
            console.log('📥 ExecutiveDashboard: Loading leads for user:', user.uid)
            const [myLeads, myStats] = await Promise.all([
                leadsService.getLeadsByExecutive(user.uid),
                leadsService.getExecutiveStats(user.uid)
            ])
            
            const filteredLeads = myLeads.filter(l => l.leadType === 'loan')
            setLeads(filteredLeads)
            setStats(myStats)
            
            // Refresh selectedLead reference if dialog is open
            setSelectedLead(current => {
                if (!current) return null
                return filteredLeads.find(l => l.id === current.id) || current
            })
            console.log('📥 ExecutiveDashboard: State updated with leads')
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
        loadMyLeads() // Refresh leads after update
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mis Leads</h2>
                <p className="text-muted-foreground">
                    Gestiona tus leads asignados de préstamos.
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStats
                    title="Nuevos"
                    value={loading ? "..." : stats.newLeads}
                    description="Leads pendientes de primer contacto"
                    icon={PhoneCall}
                    iconColor="text-blue-500"
                />
                <DashboardStats
                    title="Citas"
                    value={loading ? "..." : stats.appointments}
                    description="Leads con cita agendada"
                    icon={PhoneCall}
                    iconColor="text-green-500"
                />
                <DashboardStats
                    title="Pte. Legal"
                    value={loading ? "..." : stats.pendingLegal}
                    description="A la espera de revisión legal"
                    icon={PhoneCall}
                    iconColor="text-orange-500"
                />
                <DashboardStats
                    title="Pte. Comercial"
                    value={loading ? "..." : stats.pendingCommercial}
                    description="A la espera de revisión comercial"
                    icon={PhoneCall}
                    iconColor="text-purple-500"
                />
            </div>

            {/* Leads Table */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Lista de Leads</h3>
                {loading ? (
                    <p>Cargando tus leads...</p>
                ) : (
                    <>
                        {console.log('📤 ExecutiveDashboard: Passing leads to table:', leads)}
                        <LeadsTable leads={leads} onLeadClick={handleLeadClick} />
                    </>
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
