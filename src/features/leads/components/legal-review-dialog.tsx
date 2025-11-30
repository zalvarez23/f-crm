import { useState } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Lead } from "../types/leads.types"
import { leadsService } from "../services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import { Badge } from "@/components/ui/badge"

const formSchema = z.object({
  legalComments: z.string().min(10, "Los comentarios deben tener al menos 10 caracteres"),
})

interface LegalReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess: () => void
}

export function LegalReviewDialog({ open, onOpenChange, lead, onSuccess }: LegalReviewDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legalComments: "",
    },
  })

  async function handleApprove(values: z.infer<typeof formSchema>) {
    if (!lead?.id || !user) return

    setIsLoading(true)
    try {
      await leadsService.approveLead(lead.id, values.legalComments, user.uid)
      onSuccess()
      onOpenChange(false)
      form.reset()
      setAction(null)
    } catch (error) {
      console.error(error)
      alert("Error al aprobar el lead")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject(values: z.infer<typeof formSchema>) {
    if (!lead?.id || !user) return

    setIsLoading(true)
    try {
      await leadsService.rejectLead(lead.id, values.legalComments, user.uid)
      onSuccess()
      onOpenChange(false)
      form.reset()
      setAction(null)
    } catch (error) {
      console.error(error)
      alert("Error al rechazar el lead")
    } finally {
      setIsLoading(false)
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (action === 'approve') {
      handleApprove(values)
    } else if (action === 'reject') {
      handleReject(values)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisión Legal - {lead.name}</DialogTitle>
          <DialogDescription>
            Revisa la información y documentos del lead antes de aprobar o rechazar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Executive Assessment (Read-only) */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Evaluación del Ejecutivo</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Estado:</span>{" "}
                <Badge variant="outline">{lead.status}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Subestado:</span>{" "}
                <Badge variant="outline">{lead.substatus || "N/A"}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Monto:</span>{" "}
                S/ {lead.amount?.toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">Tasa:</span>{" "}
                {lead.interestRate}%
              </div>
            </div>
          </div>

          {/* Documents Status */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Documentos</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {lead.documents?.dni ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>DNI</span>
              </div>
              <div className="flex items-center gap-2">
                {lead.documents?.puhr ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>PUHR</span>
              </div>
              <div className="flex items-center gap-2">
                {lead.documents?.copiaLiteral ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>Copia Literal</span>
              </div>
              <div className="flex items-center gap-2">
                {lead.documents?.casa ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>Casa</span>
              </div>
            </div>
          </div>

          {/* Legal Comments Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="legalComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios Legales (Requerido)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explica la razón de tu decisión..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    form.reset()
                    setAction(null)
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  onClick={() => setAction('reject')}
                  disabled={isLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  type="submit"
                  onClick={() => setAction('approve')}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
