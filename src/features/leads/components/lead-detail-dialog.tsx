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
import { Loader2, FileText, ExternalLink } from "lucide-react"
import type { Lead } from "../types/leads.types"
import { leadsService } from "../services/leads.service"

const formSchema = z.object({
  notes: z.string().optional(),
  status: z.enum(['nuevo', 'contactado', 'contacto_no_efectivo', 'no_contactado', 'rechazado']),
  substatus: z.enum([
    'interesado', 'gestion_whatsapp', 'inversionista', 'agendado_potencial', 'cita', 'seguimiento', 'en_validacion',
    'no_califica', 'prestamo_menos_15000', 'consiguio_prestamo', 'no_interesado', 'llamado_muda', 
    'gestionado_otro_agente', 'contacto_terceros', 'fallecio', 'numero_equivocado', 'no_dejo_datos', 
    'corta_llamada', 'volver_llamar',
    'telefono_no_existe', 'numero_suspendido', 'no_contesta', 'apagado'
  ]).optional(),
  department: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  identityDocument: z.string().optional(),
  amount: z.number().min(0).optional().or(z.literal('')),
  interestRate: z.number().min(0).max(100).optional().or(z.literal('')),
  meetsRequirements: z.boolean().optional(),
})

interface LeadDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onSuccess: () => void
}

export function LeadDetailDialog({ open, onOpenChange, lead, onSuccess }: LeadDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Lead['documents']>({})

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
      console.log('Updating lead with values:', values)
      
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
        amount: values.amount === '' ? 0 : Number(values.amount),
        interestRate: values.interestRate === '' ? undefined : Number(values.interestRate),
        meetsRequirements: values.meetsRequirements,
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
  // 2. It's been approved by legal (legalStatus = approved)
  // 3. It's in commercial review (commercialStatus = pending_review)
  // 4. It's been approved by commercial (commercialStatus = approved)
  const isInReview = lead.legalStatus === 'pending_review' || lead.commercialStatus === 'pending_review'
  const isApproved = lead.legalStatus === 'approved' || lead.commercialStatus === 'approved'
  const isEditable = !isInReview && !isApproved

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
        {!isEditable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              {isInReview && '⏳ This lead is currently in review and cannot be edited.'}
              {isApproved && '✅ This lead has been approved and cannot be edited.'}
            </p>
          </div>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="loan">Loan</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
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

              {/* Loan Details Tab */}
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

              {/* Documents Tab */}
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

              <DialogFooter>
                {isEditable ? (
                  <Button
                    type="submit"
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
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
