import { useState, useEffect } from "react"
import { useAuth } from "@/shared/context/auth-context"
import { leadsService } from "@/features/leads/services/leads.service"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import type { Lead } from "@/features/leads/types/leads.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, DollarSign, Calendar } from "lucide-react"

export function AppraisalDashboard() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadAppraisalLeads()
    }
  }, [user])

  const loadAppraisalLeads = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      console.log('📥 AppraisalDashboard: Loading leads...')
      const appraisalLeads = await leadsService.getLeadsForAppraisalManager()
      console.log('📥 AppraisalDashboard: Received leads:', appraisalLeads.length)
      setLeads(appraisalLeads)
    } catch (error) {
      console.error('Error loading appraisal leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDialogOpen(true)
  }

  const handleSuccess = () => {
    loadAppraisalLeads()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading leads...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Tasaciones</h2>
        <p className="text-muted-foreground">
          Leads con pago de tasación confirmado
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Confirmados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              Leads con tasación pagada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pagos de Hoy
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter(lead => {
                if (!lead.closerFollowUp?.paymentDate) return false
                // Handle Firestore timestamp or Date object
                const paymentDate = lead.closerFollowUp.paymentDate.toDate 
                  ? lead.closerFollowUp.paymentDate.toDate() 
                  : new Date(lead.closerFollowUp.paymentDate)
                
                const today = new Date()
                return paymentDate.toDateString() === today.toDateString()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmados hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monto Estimado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/ {leads.reduce((acc, lead) => acc + (Number(lead.appointment?.appraisalCost) || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total recaudado en tasaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads para Tasación</CardTitle>
          <CardDescription>
            Lista de clientes listos para proceso de tasación
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
