import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, ExternalLink, AlertTriangle } from "lucide-react"
import type { Lead } from "../types/leads.types"
import { leadsService } from "../services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import { CloserFollowUpForm } from "./closer-follow-up-form"
import { AppraisalForm } from "./appraisal-form"

const formSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['nuevo', 'contactado', 'contacto_no_efectivo', 'no_contactado', 'rechazado']),
  substatus: z.enum([
    'interesado', 'gestion_whatsapp', 'inversionista', 'agendado_potencial', 'cita', 'seguimiento', 'en_validacion', 'aprobado',
    'no_califica', 'prestamo_menos_15000', 'consiguio_prestamo', 'no_interesado', 'llamado_muda', 
    'gestionado_otro_agente', 'contacto_terceros', 'fallecio', 'numero_equivocado', 'no_dejo_datos', 
    'corta_llamada', 'volver_llamar', 'reprogramar',
    'telefono_no_existe', 'numero_suspendido', 'no_contesta', 'apagado'
  ]).optional(),
  department: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  identityDocument: z.string().optional(),
  amount: z.union([z.number(), z.string()]).optional(),
  interestRate: z.union([z.number(), z.string()]).optional(),
  meetsRequirements: z.boolean().optional(),
  appointment: z.object({
    date: z.string().optional(),
    time: z.string().optional(),
    type: z.enum(['presencial', 'virtual']).optional(),
    appraisalCost: z.union([z.number(), z.string()]).optional()
  }).optional(),
  maritalStatus: z.string().optional(),
  bank: z.string().optional(),
  bankAccount: z.string().optional(),
  interbankAccount: z.string().optional(),
})

interface LeadDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess: () => void
}

export function LeadDetailDialog({ open, onOpenChange, lead, onSuccess }: LeadDetailDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Lead['documents']>({})
  const [activeTab, setActiveTab] = useState("basic")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      status: "nuevo",
      substatus: undefined,
      department: "",
      province: "",
      district: "",
      address: "",
      identityDocument: "",
      amount: '' as any,
      interestRate: '' as any,
      meetsRequirements: undefined,
      appointment: undefined,
      maritalStatus: "",
      bank: "",
      bankAccount: "",
      interbankAccount: ""
    },
  })

  useEffect(() => {
    if (lead) {
      form.reset({
        notes: lead.notes || "",
        status: lead.status,
        substatus: lead.substatus,
        department: lead.department || "",
        province: lead.province || "",
        district: lead.district || "",
        address: lead.address || "",
        identityDocument: lead.identityDocument || "",
        amount: lead.amount as any || '' as any,
        interestRate: lead.interestRate as any || '' as any,
        meetsRequirements: lead.meetsRequirements,
        appointment: lead.appointment ? {
          date: lead.appointment.date || '',
          time: lead.appointment.time || '',
          type: lead.appointment.type,
          appraisalCost: lead.appointment.appraisalCost as any || '' as any
        } : undefined,
        maritalStatus: lead.maritalStatus || "",
        bank: lead.bank || "",
        bankAccount: lead.bankAccount || "",
        interbankAccount: lead.interbankAccount || ""
      })
      setDocuments(lead.documents || {})
    }
  }, [lead, form])

  // Handle dialog close - reset form to original values
  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen && lead) {
      // Reset form to original lead values when closing
      form.reset({
        notes: lead.notes || "",
        status: lead.status,
        substatus: lead.substatus,
        department: lead.department || "",
        province: lead.province || "",
        district: lead.district || "",
        address: lead.address || "",
        identityDocument: lead.identityDocument || "",
        amount: lead.amount as any || '' as any,
        interestRate: lead.interestRate as any || '' as any,
        meetsRequirements: lead.meetsRequirements,
        maritalStatus: lead.maritalStatus || "",
        bank: lead.bank || "",
        bankAccount: lead.bankAccount || "",
        interbankAccount: lead.interbankAccount || ""
      })
    }
    onOpenChange(isOpen)
  }

  async function handleFileUpload(file: File, type: 'dni' | 'puhr' | 'copiaLiteral' | 'casa') {
    if (!lead?.id) return

    // Validate PDF
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed')
      return
    }

    setUploadingDoc(type)
    try {
      const url = await leadsService.uploadDocument(lead.id, file, type)
      
      const updatedDocs = { ...documents, [type]: url }
      setDocuments(updatedDocs)
      
      // Update lead with new document URL
      await leadsService.updateLead(lead.id, {
        documents: updatedDocs
      })
      
      alert('Document uploaded successfully')
    } catch (error) {
      console.error(error)
      alert('Error uploading document')
    } finally {
      setUploadingDoc(null)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!lead?.id) return

    setIsLoading(true)
    try {
      console.log('🚀 LeadDetailDialog: Submitting update...', {
        values,
        currentLead: {
          legalStatus: lead.legalStatus,
          commercialStatus: lead.commercialStatus,
          closerAssignedTo: lead.closerAssignedTo
        }
      })
      
      // Prepare update data and remove undefined values (Firestore doesn't accept undefined)
      const updateData: Partial<Lead> = {
        notes: values.notes,
        status: values.status,
        substatus: values.substatus,
        department: values.department,
        province: values.province,
        district: values.district,
        address: values.address,
        identityDocument: values.identityDocument,
        meetsRequirements: values.meetsRequirements,
        maritalStatus: values.maritalStatus,
        bank: values.bank,
        bankAccount: values.bankAccount,
        interbankAccount: values.interbankAccount,
      }

      // Handle number fields that might be empty strings from the form
      if (values.amount !== undefined && values.amount !== '') {
        updateData.amount = Number(values.amount);
      } else {
        updateData.amount = undefined; // Explicitly set to undefined if empty or not provided
      }

      if (values.interestRate !== undefined && values.interestRate !== '') {
        updateData.interestRate = Number(values.interestRate);
      } else {
        updateData.interestRate = undefined; // Explicitly set to undefined if empty or not provided
      }

      // Handle appointment data
      if (values.appointment && values.appointment.type) {
        updateData.appointment = {
          date: values.appointment.date || '',
          time: values.appointment.time || '',
          type: values.appointment.type,
          appraisalCost: values.appointment.appraisalCost ? Number(values.appointment.appraisalCost) : undefined
        } as any
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })

      await leadsService.updateLead(lead.id, updateData)
      console.log('Lead updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating lead:', error)
      alert(`Error updating lead: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!lead) return null

  // Determine if the lead is editable
  // Lead is NOT editable if:
  // 1. It's in legal review (legalStatus = pending_review)
  // 2. It's in commercial review (commercialStatus = pending_review)
  // 3. Appointment has been locked (appointmentLocked = true)
  // EXCEPTION: If both Legal and Commercial have approved AND appointment not locked yet, allow editing for appointment scheduling
  const isInReview = lead.legalStatus === 'pending_review' || lead.commercialStatus === 'pending_review'
  const bothApproved = lead.legalStatus === 'approved' && lead.commercialStatus === 'approved'
  const appointmentLocked = lead.appointmentLocked === true
  const isEditable = (!isInReview || bothApproved) && !appointmentLocked

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Details - {lead.name}</DialogTitle>
          <DialogDescription>
            {isEditable ? 'View and update complete lead information' : 'View lead information (Read-only)'}
          </DialogDescription>
        </DialogHeader>

        {/* Read-only warning */}
        {!isEditable && !lead.closerFollowUp?.markedAsLost && !lead.closerFollowUp?.lostDueToNonPayment && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              {isInReview && '⏳ This lead is currently in review and cannot be edited.'}
              {appointmentLocked && '🔒 Appointment has been scheduled and locked. Cannot edit for security.'}
            </p>
          </div>
        )}

        {/* Lost Lead highlight */}
        {(lead.closerFollowUp?.markedAsLost || lead.closerFollowUp?.lostDueToNonPayment) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              LEAD PERDIDO
            </h4>
            {lead.closerFollowUp.lostReason && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Motivo:</strong> {lead.closerFollowUp.lostReason}
              </p>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="location">Ubicación</TabsTrigger>
            {lead.leadType === 'investment' ? (
                <TabsTrigger value="investment">Datos Inversión</TabsTrigger>
            ) : (
                <TabsTrigger value="loan">Préstamo</TabsTrigger>
            )}
            {lead.leadType === 'loan' && (
                <TabsTrigger value="documents">Documentos</TabsTrigger>
            )}
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="appointment">Cita</TabsTrigger>
            {lead.closerAssignedTo && user?.role === 'closer' && (
              <TabsTrigger value="closer" className="bg-blue-50 border-blue-200">
                Closer Follow-up
              </TabsTrigger>
            )}
            {lead.closerFollowUp?.paidAppraisal && 
             ['appraisal_manager', 'supervisor', 'administrator', 'investment_executive'].includes(user?.role || '') && (
              <TabsTrigger value="appraisal" className="bg-green-50 border-green-200">
                Tasación
              </TabsTrigger>
            )}
          </TabsList>

          <Form {...form}>
            <form id="lead-form" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">{lead.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{lead.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{lead.email || "-"}</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="nuevo">Nuevo</SelectItem>
                          <SelectItem value="contactado">Contactado</SelectItem>
                          <SelectItem value="contacto_no_efectivo">Contacto No Efectivo</SelectItem>
                          <SelectItem value="no_contactado">No Contactado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("status") === "contactado" && (
                  <FormField
                    control={form.control}
                    name="substatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subestado del Lead</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar subestado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="interesado">Interesado</SelectItem>
                            <SelectItem value="gestion_whatsapp">Gestión de WhatsApp</SelectItem>
                            <SelectItem value="inversionista">Inversionista</SelectItem>
                            <SelectItem value="agendado_potencial">Agendado Potencial</SelectItem>
                            <SelectItem value="cita">Cita</SelectItem>
                            <SelectItem value="aprobado">Aprobado (Listo para Cita)</SelectItem>
                            <SelectItem value="seguimiento">Seguimiento</SelectItem>
                            <SelectItem value="en_validacion">En Validación</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("status") === "contacto_no_efectivo" && (
                  <FormField
                    control={form.control}
                    name="substatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subestado del Lead</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar subestado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no_califica">No Califica</SelectItem>
                            <SelectItem value="prestamo_menos_15000">Préstamo Menos de S/15,000</SelectItem>
                            <SelectItem value="consiguio_prestamo">Consiguió Préstamo</SelectItem>
                            <SelectItem value="no_interesado">No Interesado</SelectItem>
                            <SelectItem value="llamado_muda">Llamado Muda</SelectItem>
                            <SelectItem value="gestionado_otro_agente">Gestionado por Otro Agente</SelectItem>
                            <SelectItem value="contacto_terceros">Contacto con Terceros</SelectItem>
                            <SelectItem value="fallecio">Falleció</SelectItem>
                            <SelectItem value="numero_equivocado">Número Equivocado</SelectItem>
                            <SelectItem value="no_dejo_datos">No Dejó Datos</SelectItem>
                            <SelectItem value="corta_llamada">Corta la Llamada</SelectItem>
                            <SelectItem value="volver_llamar">Volver a Llamar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("status") === "no_contactado" && (
                  <FormField
                    control={form.control}
                    name="substatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subestado del Lead</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar subestado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="telefono_no_existe">Teléfono No Existe</SelectItem>
                            <SelectItem value="numero_suspendido">Número Suspendido / Fuera de Servicio</SelectItem>
                            <SelectItem value="no_contesta">No Contesta</SelectItem>
                            <SelectItem value="apagado">Apagado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lima" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lima" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distrito</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Miraflores" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Investment Details Tab */}
              {lead.leadType === 'investment' && (
                <TabsContent value="investment" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="identityDocument"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>DNI / Documento Identidad</FormLabel>
                          <FormControl>
                            <Input placeholder="DNI del inversionista" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capital a Invertir (S/)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 100000" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado civil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="soltero">Soltero(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viudo">Viudo(a)</SelectItem>
                            <SelectItem value="conviviente">Conviviente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Datos Bancarios</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bank"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Banco</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre del banco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuenta Bancaria</FormLabel>
                            <FormControl>
                              <Input placeholder="Nro de cuenta" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="interbankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cuenta Interbancaria (CCI)</FormLabel>
                            <FormControl>
                              <Input placeholder="CCI" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Loan Details Tab */}
              {lead.leadType === 'loan' && (
                <TabsContent value="loan" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="identityDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documento de Identidad (DNI)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto del Préstamo (PEN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 50000" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>% Tasa de Interés</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="e.g., 12.5" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meetsRequirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cumple Requisitos</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === 'true')} 
                          value={field.value === undefined ? '' : field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Sí</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              )}

              {/* Documents Tab - Only for Loan leads */}
              {lead.leadType === 'loan' && (
                <TabsContent value="documents" className="space-y-4">
                  {['dni', 'puhr', 'copiaLiteral', 'casa'].map((docType) => (
                    <div key={docType} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">
                          {docType === 'copiaLiteral' ? 'Copia Literal' : docType.toUpperCase()}
                        </h4>
                        {documents?.[docType as keyof typeof documents] && (
                          <a 
                            href={documents?.[docType as keyof typeof documents]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View PDF
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file, docType as any)
                          }}
                          disabled={uploadingDoc === docType}
                        />
                        {uploadingDoc === docType && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              )}

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add observations about this lead..." 
                          className="resize-none min-h-[200px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Appointment Tab - Only show when both approvals exist and status is Contactado + Cita */}
              <TabsContent value="appointment" className="space-y-4">
                {lead.legalStatus === 'approved' && lead.commercialStatus === 'approved' && 
                 form.watch('status') === 'contactado' && form.watch('substatus') === 'cita' ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-green-800">
                        ✅ Lead approved by Legal and Commercial. You can now schedule an appointment.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="appointment.date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              disabled={!isEditable}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointment.time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              disabled={!isEditable}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointment.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appointment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!isEditable}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select appointment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="presencial">Presencial</SelectItem>
                              <SelectItem value="virtual">Virtual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appointment.appraisalCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo de Tasación (S/)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              step="0.01"
                              {...field} 
                              disabled={!isEditable}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Appointment scheduling is only available when:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
```
                      <li>Lead has been approved by Legal</li>
                      <li>Lead has been approved by Commercial</li>
                      <li>Status is "Contactado" and Substatus is "Cita"</li>
                    </ul>
                  </div>
                )}
              </TabsContent>

            </form>
          </Form>

          {/* Closer Follow-up Tab - Only visible to users with 'closer' role */}
          {lead.closerAssignedTo && user?.role === 'closer' && (
            <TabsContent value="closer" className="space-y-4">
              <CloserFollowUpForm
                key={`closer-form-${lead.id}-${lead.closerFollowUp?.clientAttended}-${lead.closerFollowUp?.attendanceRecordedAt}`}
                lead={lead}
                currentUserId={user.uid}
                onSuccess={onSuccess}
              />
            </TabsContent>
          )}

          {lead.closerFollowUp?.paidAppraisal && user && 
           ['appraisal_manager', 'supervisor', 'administrator', 'investment_executive'].includes(user.role || '') && (
            <TabsContent value="appraisal" className="space-y-4">
              <AppraisalForm
                lead={lead}
                currentUserId={user.uid}
                onSuccess={onSuccess}
              />
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          {isEditable && !['closer', 'appraisal'].includes(activeTab) ? (
            <Button
              type="submit"
              form="lead-form"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
