import { useState, useEffect } from "react"
import { useAuth } from "@/shared/context/auth-context"
import { leadsService } from "@/features/leads/services/leads.service"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import type { Lead } from "@/features/leads/types/leads.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"

export function CloserDashboard() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadCloserLeads()
    }
  }, [user])

  const loadCloserLeads = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      console.log('📥 CloserDashboard: Loading leads for closer:', user.uid)
      const closerLeads = await leadsService.getLeadsByCloser(user.uid)
      console.log('📥 CloserDashboard: Received leads:', closerLeads.length)
      setLeads(closerLeads)
      
      // Refresh selectedLead reference if dialog is open
      setSelectedLead(current => {
        if (!current) return null
        return closerLeads.find(l => l.id === current.id) || current
      })
    } catch (error) {
      console.error('Error loading closer leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedLead(null)
  }

  const handleSuccess = () => {
    loadCloserLeads()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading appointments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Closer Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your scheduled appointments
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled appointments to attend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(lead => {
                if (!lead.appointment?.date) return false
                const today = new Date().toISOString().split('T')[0]
                return lead.appointment.date === today
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Appointments scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(lead => {
                if (!lead.appointment?.date) return false
                const appointmentDate = new Date(lead.appointment.date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return appointmentDate > today
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Future appointments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Appointments</CardTitle>
          <CardDescription>
            All leads with appointments assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable leads={leads} onLeadClick={handleLeadClick} />
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <LeadDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={selectedLead}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
