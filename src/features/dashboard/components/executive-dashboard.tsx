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
            const myLeads = await leadsService.getLeadsByExecutive(user.uid)
            console.log('📥 ExecutiveDashboard: Received leads from service:', myLeads)
            setLeads(myLeads)
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
                <h2 className="text-3xl font-bold tracking-tight">My Leads</h2>
                <p className="text-muted-foreground">
                    Manage your assigned leads
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DashboardStats
                    title="Assigned Leads"
                    value={loading ? "..." : leads.length}
                    description="Total leads assigned to you"
                    icon={PhoneCall}
                    iconColor="text-blue-500"
                />
            </div>

            {/* Leads Table */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Lead List</h3>
                {loading ? (
                    <p>Loading your leads...</p>
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
