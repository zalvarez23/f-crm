import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Calendar, AlertTriangle } from "lucide-react"
import type { Lead } from "../types/leads.types"
import { leadsService } from "../services/leads.service"
import { serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"

interface CloserFollowUpFormProps {
  lead: Lead
  currentUserId: string
  onSuccess: () => void
}

export function CloserFollowUpForm({ lead, currentUserId, onSuccess }: CloserFollowUpFormProps) {
  const [clientAttended, setClientAttended] = useState<boolean | null>(
    lead.closerFollowUp?.clientAttended ?? null
  )
  const [acceptsTerms, setAcceptsTerms] = useState<boolean | undefined>(
    lead.closerFollowUp?.acceptsTerms
  )
  const [clientIncome, setClientIncome] = useState<string>(
    lead.closerFollowUp?.clientIncome?.toString() || ''
  )
  const [loanReason, setLoanReason] = useState<string>(
    lead.closerFollowUp?.loanReason || ''
  )
  const [agreedQuota, setAgreedQuota] = useState<string>(
    lead.closerFollowUp?.agreedQuota?.toString() || ''
  )
  const [paymentPlan, setPaymentPlan] = useState<string>(
    lead.closerFollowUp?.paymentPlan || ''
  )
  const [paidAppraisal, setPaidAppraisal] = useState<boolean | undefined>(
    lead.closerFollowUp?.paidAppraisal
  )
  const [paymentCommitmentDate, setPaymentCommitmentDate] = useState<string>(
    lead.closerFollowUp?.paymentCommitmentDate || ''
  )
  const [lostReason, setLostReason] = useState<string>(
    lead.closerFollowUp?.lostReason || ''
  )
  const [isLoading, setIsLoading] = useState(false)
  
  // Synchronize state with prop changes (for reactivity when dashboard refreshes)
  useEffect(() => {
    setClientAttended(lead.closerFollowUp?.clientAttended ?? null)
    setAcceptsTerms(lead.closerFollowUp?.acceptsTerms)
    setClientIncome(lead.closerFollowUp?.clientIncome?.toString() || '')
    setLoanReason(lead.closerFollowUp?.loanReason || '')
    setAgreedQuota(lead.closerFollowUp?.agreedQuota?.toString() || '')
    setPaymentPlan(lead.closerFollowUp?.paymentPlan || '')
    setPaidAppraisal(lead.closerFollowUp?.paidAppraisal)
    setPaymentCommitmentDate(lead.closerFollowUp?.paymentCommitmentDate || '')
    setLostReason(lead.closerFollowUp?.lostReason || '')
  }, [lead])

  const hasRecordedAttendance = clientAttended !== null

  const handleSaveAttendance = async (attended: boolean) => {
    setIsLoading(true)
    try {
      await leadsService.updateLead(lead.id!, {
        closerFollowUp: {
          clientAttended: attended,
          attendanceRecordedAt: serverTimestamp() as any,
          attendanceRecordedBy: currentUserId
        }
      })
      // Update local state immediately for instant UI feedback
      setClientAttended(attended)
      // Then trigger parent refresh
      await onSuccess()
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast.error('Error al guardar asistencia')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsLost = async () => {
    if (!lostReason.trim()) {
      toast.error('Por favor ingrese el motivo por el cual se perdió el lead')
      return
    }
    if (!confirm('¿Está seguro de marcar este lead como perdido?')) return
    
    setIsLoading(true)
    try {
      await leadsService.updateLead(lead.id!, {
        closerFollowUp: {
          ...lead.closerFollowUp,
          clientAttended: false,
          markedAsLost: true,
          lostReason: lostReason.trim(),
          attendanceRecordedAt: serverTimestamp() as any,
          attendanceRecordedBy: currentUserId
        },
        status: 'rechazado'
      })
      toast.success('Lead marcado como perdido')
      onSuccess()
    } catch (error) {
      console.error('Error marking as lost:', error)
      toast.error('Error al marcar como perdido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!confirm('¿Está seguro de solicitar una reprogramación? El lead volverá al ejecutivo original.')) return
    
    setIsLoading(true)
    try {
      await leadsService.updateLead(lead.id!, {
        status: 'contactado',
        substatus: 'reprogramar',
        assignedTo: lead.previousOwner || lead.assignedTo, // Return to original executive
        appointmentLocked: false, // Unlock for rescheduling
        closerFollowUp: {
          ...lead.closerFollowUp,
          clientAttended: false,
          markedAsLost: false,
          rescheduledAt: serverTimestamp() as any,
          rescheduledBy: currentUserId
        }
      })
      toast.success('Lead listo para reprogramación. Se ha devuelto al ejecutivo.')
      onSuccess()
    } catch (error) {
      console.error('Error rescheduling lead:', error)
      toast.error('Error al solicitar reprogramación')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveClientInfo = async () => {
    if (acceptsTerms === undefined) {
      toast.error('Por favor indique si el cliente acepta los términos')
      return
    }
    if (!clientIncome || Number(clientIncome) <= 0) {
      toast.error('Por favor ingrese los ingresos del cliente')
      return
    }
    if (!loanReason.trim()) {
      toast.error('Por favor ingrese el motivo del préstamo')
      return
    }
    if (!agreedQuota || Number(agreedQuota) <= 0) {
      toast.error('Por favor ingrese el acuerdo de cuota')
      return
    }
    if (!paymentPlan.trim()) {
      toast.error('Por favor ingrese la modalidad y plan de pago')
      return
    }
    // Only require paidAppraisal if it's not already handled by commitment/lost
    if (paidAppraisal === undefined && !paymentCommitmentDate && !lead.closerFollowUp?.lostDueToNonPayment) {
      toast.error('Por favor indique si realizó el pago de tasación')
      return
    }
    
    // If appraisal not paid, require commitment date or lost status
    if (paidAppraisal === false && !paymentCommitmentDate && !lead.closerFollowUp?.lostDueToNonPayment) {
      toast.error('Por favor ingrese la fecha de compromiso de pago')
      return
    }

    setIsLoading(true)
    try {
      await leadsService.updateLead(lead.id!, {
        closerFollowUp: {
          clientAttended: true,
          attendanceRecordedAt: lead.closerFollowUp?.attendanceRecordedAt || (serverTimestamp() as any),
          attendanceRecordedBy: lead.closerFollowUp?.attendanceRecordedBy || currentUserId,
          acceptsTerms,
          clientIncome: Number(clientIncome),
          loanReason: loanReason.trim(),
          agreedQuota: Number(agreedQuota),
          paymentPlan: paymentPlan.trim(),
          paidAppraisal,
          paymentCommitmentDate: paidAppraisal === false ? paymentCommitmentDate : undefined
        }
      })
      toast.success('Información del cliente guardada exitosamente')
      onSuccess()
    } catch (error) {
      console.error('Error saving client info:', error)
      toast.error('Error al guardar información del cliente')
    } finally {
      setIsLoading(false)
    }
  }

  // If attendance not recorded yet
  if (!hasRecordedAttendance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registro de Asistencia</CardTitle>
          <CardDescription>
            ¿El cliente asistió a la cita programada?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => handleSaveAttendance(true)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Sí, asistió
            </Button>
            <Button
              onClick={() => handleSaveAttendance(false)}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              No asistió
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If client did NOT attend
  if (clientAttended === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Cliente No Asistió</CardTitle>
          <CardDescription>
            El cliente no asistió a la cita. Seleccione una acción:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lostReason">Motivo de Pérdida (Requerido para marcar como perdido)</Label>
              <Textarea
                id="lostReason"
                placeholder="Explique por qué se perdió este lead..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="min-h-[100px]"
                disabled={isLoading || lead.closerFollowUp?.markedAsLost}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleReschedule}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reagendar Cita
              </Button>
              <Button
                onClick={handleMarkAsLost}
                disabled={isLoading || lead.closerFollowUp?.markedAsLost}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {lead.closerFollowUp?.markedAsLost ? 'Marcado como Perdido' : 'Marcar como Perdido'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If client DID attend - show client info form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">Cliente Asistió ✓</CardTitle>
        <CardDescription>
          Complete la información del cliente después de la cita
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Accepts Terms */}
        <div className="space-y-3">
          <Label>¿Cliente acepta 10% + gastos nominales y registrales?</Label>
          <RadioGroup
            value={acceptsTerms?.toString()}
            onValueChange={(value) => setAcceptsTerms(value === 'true')}
            disabled={lead.closerFollowUp?.acceptsTerms !== undefined}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="accepts-yes" />
              <Label htmlFor="accepts-yes" className="cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="accepts-no" />
              <Label htmlFor="accepts-no" className="cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Client Income */}
        <div className="space-y-2">
          <Label htmlFor="clientIncome">Ingresos del Cliente (S/)</Label>
          <Input
            id="clientIncome"
            type="number"
            placeholder="0.00"
            step="0.01"
            value={clientIncome}
            onChange={(e) => setClientIncome(e.target.value)}
            disabled={lead.closerFollowUp?.clientIncome !== undefined}
          />
        </div>

        {/* Loan Reason */}
        <div className="space-y-2">
          <Label htmlFor="loanReason">Motivo de Préstamo</Label>
          <Textarea
            id="loanReason"
            placeholder="Describa el motivo del préstamo..."
            value={loanReason}
            onChange={(e) => setLoanReason(e.target.value)}
            disabled={lead.closerFollowUp?.loanReason !== undefined}
            className="min-h-[100px]"
          />
        </div>

        {/* Agreed Quota */}
        <div className="space-y-2">
          <Label htmlFor="agreedQuota">Acuerdo de Cuota (S/)</Label>
          <Input
            id="agreedQuota"
            type="number"
            placeholder="0.00"
            step="0.01"
            value={agreedQuota}
            onChange={(e) => setAgreedQuota(e.target.value)}
            disabled={lead.closerFollowUp?.agreedQuota !== undefined}
          />
        </div>

        {/* Payment Plan */}
        <div className="space-y-2">
          <Label htmlFor="paymentPlan">Modalidad y Plan de Pago</Label>
          <Textarea
            id="paymentPlan"
            placeholder="Describa la modalidad y plan de pago..."
            value={paymentPlan}
            onChange={(e) => setPaymentPlan(e.target.value)}
            disabled={lead.closerFollowUp?.paymentPlan !== undefined}
            className="min-h-[80px]"
          />
        </div>

        {/* Paid Appraisal */}
        <div className="space-y-3">
          <Label>¿Realizó pago de tasación?</Label>
          <RadioGroup
            value={paidAppraisal?.toString()}
            onValueChange={(value) => setPaidAppraisal(value === 'true')}
            disabled={lead.closerFollowUp?.paidAppraisal !== undefined}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="paid-yes" />
              <Label htmlFor="paid-yes" className="cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="paid-no" />
              <Label htmlFor="paid-no" className="cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Commitment - Only show if appraisal NOT paid */}
        {paidAppraisal === false && (
          <Card className="border-l-4 border-l-orange-500 border-y border-r border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Pago de Tasación Pendiente
              </CardTitle>
              <CardDescription className="text-gray-600">
                El cliente no ha realizado el pago. Es necesario registrar un compromiso o marcar la pérdida.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-0">
              {/* Show Commitment Option if not lost */}
              {!lead.closerFollowUp?.lostDueToNonPayment && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="commitmentDate" className="text-gray-700 font-medium">
                      Opción A: Registrar Compromiso de Pago
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="commitmentDate"
                        type="date"
                        className="flex-1 text-gray-900"
                        value={paymentCommitmentDate}
                        onChange={(e) => setPaymentCommitmentDate(e.target.value)}
                        disabled={!!lead.closerFollowUp?.paymentCommitmentDate}
                      />
                    </div>
                    {!lead.closerFollowUp?.paymentCommitmentDate && (
                      <p className="text-xs text-gray-500">
                        Seleccione la fecha en la que el cliente se compromete a pagar.
                      </p>
                    )}
                    {lead.closerFollowUp?.paymentCommitmentDate && (
                      <div className="mt-3">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          onClick={async () => {
                            if (!confirm('¿Confirmar que el cliente ha realizado el pago de tasación?')) return
                            
                            setIsLoading(true)
                            try {
                              await leadsService.updateLead(lead.id!, {
                                closerFollowUp: {
                                  ...(lead.closerFollowUp || {}),
                                  paidAppraisal: true,
                                  paymentDate: serverTimestamp() as any
                                } as any
                              })
                              setPaidAppraisal(true)
                              toast.success('Pago confirmado exitosamente')
                              onSuccess()
                            } catch (error) {
                              console.error('Error confirming payment:', error)
                              toast.error('Error al confirmar pago')
                            } finally {
                              setIsLoading(false)
                            }
                          }}
                          disabled={isLoading}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirmar Pago Realizado
                        </Button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Haga clic aquí si el cliente ya cumplió con el compromiso de pago.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Show Lost Option only if no commitment saved */}
              {!lead.closerFollowUp?.paymentCommitmentDate && !lead.closerFollowUp?.lostDueToNonPayment && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500 font-medium">O si no hay acuerdo</span>
                  </div>
                </div>
              )}

              {!lead.closerFollowUp?.paymentCommitmentDate && (
                <>
                  <div className="space-y-4">
                    <Label className="text-gray-700 font-medium">
                      Motivo de Pérdida (Requerido)
                    </Label>
                    <Textarea
                      placeholder="Explique por qué se perdió este lead por falta de pago..."
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      className="min-h-[80px]"
                      disabled={isLoading || lead.closerFollowUp?.lostDueToNonPayment}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Opción B: Marcar como Perdido
                    </Label>
                    {lead.closerFollowUp?.lostDueToNonPayment ? (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          Lead marcado como perdido por no pago
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Button
                        variant="destructive"
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm"
                        onClick={async () => {
                          if (!lostReason.trim()) {
                            toast.error('Por favor ingrese el motivo de la pérdida')
                            return
                          }
                          if (!confirm('¿Está seguro de marcar este lead como perdido por falta de pago? Esta acción rechazará el lead.')) return
                          setIsLoading(true)
                          try {
                            await leadsService.updateLead(lead.id!, {
                              closerFollowUp: {
                                ...(lead.closerFollowUp || {}),
                                clientAttended: true,
                                lostDueToNonPayment: true,
                                lostReason: lostReason.trim()
                              } as any,
                              status: 'rechazado'
                            })
                            toast.success('Lead marcado como perdido por no pago')
                            onSuccess()
                          } catch (error) {
                            console.error('Error marking as lost due to non-payment:', error)
                            toast.error('Error al marcar como perdido')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Marcar como Perdido por No Pago
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {lead.closerFollowUp?.acceptsTerms === undefined && (
          <Button
            onClick={handleSaveClientInfo}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <span className="mr-2">⏳</span>}
            Guardar Información del Cliente
          </Button>
        )}

        {lead.closerFollowUp?.acceptsTerms !== undefined && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Información del cliente guardada exitosamente
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
