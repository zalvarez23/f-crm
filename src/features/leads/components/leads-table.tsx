import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, CheckCircle2, AlertTriangle, FileText } from "lucide-react"
import type { Lead } from "../types/leads.types"

interface LeadsTableProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

export function LeadsTable({ leads, onLeadClick }: LeadsTableProps) {
  // Debug: log leads to see their structure
  console.log('📊 LeadsTable rendering with leads:', leads.map(l => ({
    name: l.name,
    status: l.status,
    legalStatus: l.legalStatus,
    commercialStatus: l.commercialStatus
  })))

  const getStatusBadge = (lead: Lead) => {
    const { status } = lead
    
    // Check if lead is marked as lost by closer
    if (lead.closerFollowUp?.markedAsLost || lead.closerFollowUp?.lostDueToNonPayment) {
      return (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant="outline" className="bg-red-700 text-white border-red-800">
            PERDIDO
          </Badge>
          {lead.closerFollowUp.lostReason && (
            <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[120px]" title={lead.closerFollowUp.lostReason}>
              Motivo: {lead.closerFollowUp.lostReason}
            </span>
          )}
        </div>
      )
    }

    // Check for reschedule status
    if (lead.substatus === 'reprogramar') {
      return (
        <Badge variant="outline" className="bg-purple-600 text-white border-purple-700 animate-pulse">
          REPROGRAMAR
        </Badge>
      )
    }

    const statusConfig = {
      nuevo: { label: "Nuevo", className: "bg-blue-500 text-white border-blue-600" },
      contactado: { label: "Contactado", className: "bg-green-500 text-white border-green-600" },
      contacto_no_efectivo: { label: "Contacto No Efectivo", className: "bg-yellow-500 text-white border-yellow-600" },
      no_contactado: { label: "No Contactado", className: "bg-red-500 text-white border-red-600" },
      rechazado: { label: "Rechazado", className: "bg-orange-500 text-white border-orange-600" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.nuevo
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Monto / Capital</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Estado Legal</TableHead>
            <TableHead>Estado Comercial</TableHead>
            <TableHead>Cita / Seguimiento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length > 0 ? (
            leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className={onLeadClick ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onLeadClick?.(lead)}
              >
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>{lead.email || "-"}</TableCell>
                <TableCell className="font-semibold">S/ {Number(lead.amount || 0).toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(lead)}</TableCell>
                <TableCell>
                  {lead.legalStatus === 'approved' && (
                    <Badge variant="outline" className="bg-emerald-500 text-white border-emerald-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Preaprobado-Legal
                    </Badge>
                  )}
                  {lead.legalStatus === 'rejected' && (
                    <Badge variant="outline" className="bg-red-500 text-white border-red-600">
                      Rechazado-Legal
                    </Badge>
                  )}
                  {lead.legalStatus === 'pending_review' && (
                    <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-600">
                      En Revisión Legal
                    </Badge>
                  )}
                  {!lead.legalStatus && "-"}
                </TableCell>
                <TableCell>
                  {lead.commercialStatus === 'approved' && (
                    <Badge variant="outline" className="bg-emerald-500 text-white border-emerald-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Aprobado-Comercial
                    </Badge>
                  )}
                  {lead.commercialStatus === 'rejected' && (
                    <Badge variant="outline" className="bg-red-500 text-white border-red-600">
                      Rechazado-Comercial
                    </Badge>
                  )}
                  {lead.commercialStatus === 'pending_review' && (
                    <Badge variant="outline" className="bg-yellow-500 text-white border-yellow-600">
                      En Revisión Comercial
                    </Badge>
                  )}
                  {!lead.commercialStatus && "-"}
                </TableCell>

                <TableCell>
                  {lead.closerAssignedTo && lead.appointment && (
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="bg-blue-500 text-white border-blue-600">
                        <Calendar className="mr-1 h-3 w-3" />
                        Cita Programada
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        <div>📅 {new Date(lead.appointment.date).toLocaleDateString('es-PE', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}</div>
                        <div>🕐 {lead.appointment.time}</div>
                        <div>📍 {lead.appointment.type === 'presencial' ? 'Presencial' : 'Virtual'}</div>
                        {lead.appointment.appraisalCost && (
                          <div>💰 S/ {Number(lead.appointment.appraisalCost).toFixed(2)}</div>
                        )}
                      </div>
                      
                      {/* Appraisal Payment Status */}
                      {lead.closerFollowUp?.paidAppraisal && (
                        <Badge variant="outline" className="mt-1 bg-green-100 text-green-800 border-green-200 w-fit">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Tasación Pagada
                        </Badge>
                      )}
                      
                      {lead.closerFollowUp?.paidAppraisal === false && lead.closerFollowUp?.paymentCommitmentDate && (
                        <Badge variant="outline" className="mt-1 bg-orange-100 text-orange-800 border-orange-200 w-fit">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Pago Pendiente
                        </Badge>
                      )}
                      {/* Appraisal Status */}
                      {lead.appraisal?.price && (
                        <Badge variant="outline" className="mt-1 bg-emerald-100 text-emerald-800 border-emerald-200 w-fit">
                          <FileText className="mr-1 h-3 w-3" />
                          Reporte Listo
                        </Badge>
                      )}

                      {/* Investor Status */}
                      {lead.appraisal?.investorName && (
                        <Badge variant="outline" className="mt-1 bg-purple-100 text-purple-800 border-purple-200 w-fit">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Inversionista: {lead.appraisal.investorName}
                        </Badge>
                      )}
                    </div>
                  )}
                  {!lead.closerAssignedTo && "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                No hay leads registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
