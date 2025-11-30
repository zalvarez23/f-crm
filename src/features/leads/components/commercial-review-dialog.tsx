import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckCircle, XCircle, FileText, Home } from "lucide-react"
import { leadsService } from "../services/leads.service"
import type { Lead } from "../types/leads.types"
import { useAuth } from "@/shared/context/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  comments: z.string().min(10, "Los comentarios deben tener al menos 10 caracteres"),
})

interface CommercialReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess: () => void
}

export function CommercialReviewDialog({ open, onOpenChange, lead, onSuccess }: CommercialReviewDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comments: "",
    },
  })

  const handleApprove = async (values: z.infer<typeof formSchema>) => {
    if (!lead || !user) return
    
    setIsLoading(true)
    try {
      await leadsService.approveCommercialLead(lead.id!, values.comments, user.uid)
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error approving lead:", error)
      alert("Error al aprobar el lead")
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  const handleReject = async (values: z.infer<typeof formSchema>) => {
    if (!lead || !user) return
    
    setIsLoading(true)
    try {
      await leadsService.rejectCommercialLead(lead.id!, values.comments, user.uid)
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error rejecting lead:", error)
      alert("Error al rechazar el lead")
    } finally {
      setIsLoading(false)
      setActionType(null)
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (actionType === 'approve') {
      handleApprove(values)
    } else if (actionType === 'reject') {
      handleReject(values)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisión Comercial - {lead.name}</DialogTitle>
          <DialogDescription>
            Revisa la información y documentos del lead antes de aprobar o rechazar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Executive Assessment - Read Only */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Evaluación del Ejecutivo</h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-medium">{lead.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subestado</p>
                <p className="font-medium">{lead.substatus || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto Solicitado</p>
                <p className="font-medium">S/ {lead.amount?.toLocaleString() || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                <p className="font-medium">{lead.interestRate || "-"}%</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Legal Review Info */}
          {lead.legalStatus && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3">Revisión Legal</h3>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Estado Legal:</p>
                    {lead.legalStatus === 'approved' && (
                      <Badge className="bg-green-500">Aprobado</Badge>
                    )}
                    {lead.legalStatus === 'rejected' && (
                      <Badge className="bg-red-500">Rechazado</Badge>
                    )}
                  </div>
                  {lead.legalComments && (
                    <div>
                      <p className="text-sm text-muted-foreground">Comentarios Legal:</p>
                      <p className="text-sm">{lead.legalComments}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Documents Status */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Documentos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm">DNI</span>
                {lead.documents?.dni ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                )}
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm">PUHR</span>
                {lead.documents?.puhr ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                )}
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Copia Literal</span>
                {lead.documents?.copiaLiteral ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                )}
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Home className="h-4 w-4" />
                <span className="text-sm">Casa</span>
                {lead.documents?.casa ? (
                  <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Commercial Comments Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios Comerciales (Requerido)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escribe tus comentarios sobre la revisión comercial..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  onClick={() => setActionType('reject')}
                  disabled={isLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  type="submit"
                  onClick={() => setActionType('approve')}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
