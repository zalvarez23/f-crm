import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Upload, FileText, Loader2, History, Clock } from "lucide-react"
import type { Lead } from "../types/leads.types"
import { leadsService } from "../services/leads.service"
import { serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { useAuth } from "@/shared/context/auth-context"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AppraisalFormProps {
  lead: Lead
  currentUserId: string
  onSuccess: () => void
}

export function AppraisalForm({ lead, currentUserId, onSuccess }: AppraisalFormProps) {
  const { user } = useAuth()
  const isCompleted = !!lead.appraisal?.completedAt
  
  const [isEditing, setIsEditing] = useState(!isCompleted)
  const [price, setPrice] = useState<string>(lead.appraisal?.price?.toString() || '')
  const [garagePrice, setGaragePrice] = useState<string>(lead.appraisal?.garagePrice?.toString() || '')
  const [situation, setSituation] = useState<string>(lead.appraisal?.situation || '')
  const [area, setArea] = useState<string>(lead.appraisal?.area?.toString() || '')
  const [usage, setUsage] = useState<string>(lead.appraisal?.usage || '')
  const [isLoading, setIsLoading] = useState(false)
  const [reportFile, setReportFile] = useState<File | null>(null)
  
  // New Investement fields
  const [investorName, setInvestorName] = useState(lead.appraisal?.investorName || '')
  const [investorPhone, setInvestorPhone] = useState(lead.appraisal?.investorPhone || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Starting appraisal submission')
    
    if (!price || !situation || !area || !usage) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }

    if (!lead.id) {
      console.error('❌ Lead ID is missing')
      toast.error('Error: Lead ID is missing')
      return
    }

    setIsLoading(true)
    try {
      let reportUrl = lead.appraisal?.reportUrl
      console.log('📄 Current report URL:', reportUrl)
      // TODO: Enable PDF upload once CORS is configured
      if (reportFile) {
        console.log('⬆️ Uploading document...')
        const fileData = await leadsService.uploadDocument(lead.id, reportFile, 'tasacion')
        reportUrl = fileData.fileUrl
        console.log('✅ Document uploaded, URL:', reportUrl, 'Filename:', fileData.filename)
      }

      const updateData: any = {
        appraisal: {
          price: Number(price),
          garagePrice: garagePrice ? Number(garagePrice) : null,
          situation,
          area: Number(area),
          usage,
          reportUrl: reportUrl || null,
          investorName: investorName || null,
          investorPhone: investorPhone || null,
          completedAt: lead.appraisal?.completedAt || serverTimestamp(),
          completedBy: lead.appraisal?.completedBy || currentUserId
        }
      }

      // If editing an existing appraisal, add to history
      if (isCompleted) {
        const historyEntry = {
          updatedAt: new Date(), // Use client date for immediate display, Firestore will use serverTimestamp
          updatedBy: currentUserId,
          previousValues: {
            price: lead.appraisal?.price || null,
            garagePrice: lead.appraisal?.garagePrice || null,
            situation: lead.appraisal?.situation || null,
            area: lead.appraisal?.area || null,
            usage: lead.appraisal?.usage || null,
            reportUrl: lead.appraisal?.reportUrl || null,
            investorName: lead.appraisal?.investorName || null,
            investorPhone: lead.appraisal?.investorPhone || null
          }
        }
        
        const currentHistory = lead.appraisal?.history || []
        updateData.appraisal.history = [...currentHistory, historyEntry]
      }

      console.log('💾 Updating lead with data:', updateData)
      await leadsService.updateLead(lead.id, updateData)
      console.log('✅ Lead updated successfully')

      toast.success(isCompleted ? 'Tasación actualizada exitosamente' : 'Tasación registrada exitosamente')
      setIsEditing(false)
      onSuccess()
    } catch (error) {
      console.error('❌ Error al guardar tasación:', error)
      toast.error(`Error al guardar la tasación: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      console.log('🏁 Submission process finished')
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Registro de Tasación
        </CardTitle>
        {/* Edit button removed as per user request to make data permanent */}
      </CardHeader>
      <CardContent>
        {isCompleted && !isEditing && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Tasación completada. Modo de solo lectura.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Tasación (S/)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="garagePrice">Tasación Cochera (S/)</Label>
              <Input
                id="garagePrice"
                type="number"
                value={garagePrice}
                onChange={(e) => setGaragePrice(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Área (m²)</Label>
              <Input
                id="area"
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                disabled={!isEditing}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage">Uso</Label>
              <Input
                id="usage"
                value={usage}
                onChange={(e) => setUsage(e.target.value)}
                disabled={!isEditing}
                placeholder="Ej. Vivienda, Comercio"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="situation">Situación</Label>
            <Input
              id="situation"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              disabled={!isEditing}
              placeholder="Ej. Ocupado, Vacío, En construcción"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reporte de Tasación (PDF)</Label>
            {lead.appraisal?.reportUrl && (
              <div className="flex items-center gap-2 p-2 border rounded bg-gray-50 mb-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <a 
                  href={lead.appraisal.reportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver Reporte Actual
                </a>
              </div>
            )}
            
            {/* TODO: Enable PDF upload once CORS is configured */}
            {isEditing && (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              {isCompleted && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    // Reset values to saved ones
                    setPrice(lead.appraisal?.price?.toString() || '')
                    setGaragePrice(lead.appraisal?.garagePrice?.toString() || '')
                    setSituation(lead.appraisal?.situation || '')
                    setArea(lead.appraisal?.area?.toString() || '')
                    setUsage(lead.appraisal?.usage || '')
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          )}

          {/* Investor Assignment Section - Visible for Supervisors, Admins and Investment Executives */}
          {user && ["supervisor", "administrator", "investment_executive"].includes(user.role || "") && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Asignación de Inversionista
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="investorName">Nombre del Inversionista</Label>
                  <Input
                    id="investorName"
                    value={investorName}
                    onChange={(e) => setInvestorName(e.target.value)}
                    placeholder="Nombre completo"
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investorPhone">Teléfono del Inversionista</Label>
                  <Input
                    id="investorPhone"
                    value={investorPhone}
                    onChange={(e) => setInvestorPhone(e.target.value)}
                    placeholder="999888777"
                    disabled={!isEditing}
                  />
                </div>
              </div>
              {!isEditing && isCompleted && (
                  <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setIsEditing(true)}
                  >
                      Editar Asignación / Tasación
                  </Button>
              )}
            </div>
          )}
        </form>

        {/* History Section */}
        {lead.appraisal?.history && lead.appraisal.history.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial de Cambios
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {lead.appraisal.history.map((entry, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>
                        Editado el {entry.updatedAt?.toDate ? entry.updatedAt.toDate().toLocaleString() : new Date(entry.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-xs space-y-1 p-2 bg-gray-50 rounded">
                      <p><strong>Precio Anterior:</strong> S/ {entry.previousValues.price}</p>
                      <p><strong>Área Anterior:</strong> {entry.previousValues.area} m²</p>
                      <p><strong>Situación Anterior:</strong> {entry.previousValues.situation}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
