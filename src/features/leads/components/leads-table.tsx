import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      nuevo: { label: "Nuevo", className: "bg-blue-500 text-white border-blue-600" },
      contactado: { label: "Contactado", className: "bg-green-500 text-white border-green-600" },
      contacto_no_efectivo: { label: "Contacto No Efectivo", className: "bg-yellow-500 text-white border-yellow-600" },
      no_contactado: { label: "No Contactado", className: "bg-red-500 text-white border-red-600" },
      rechazado: { label: "Rechazado", className: "bg-orange-500 text-white border-orange-600" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.nuevo
    
    console.log('Badge for status:', status, '→', config.label)

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
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Legal Status</TableHead>
            <TableHead>Commercial Status</TableHead>
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
                <TableCell>{getStatusBadge(lead.status)}</TableCell>
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
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                No leads assigned yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
