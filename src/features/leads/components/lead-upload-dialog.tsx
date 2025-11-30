import { useState } from "react"
import * as XLSX from "xlsx"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"
import { leadsService } from "../services/leads.service"
import type { LeadUploadRow } from "../types/leads.types"
import type { UserProfile } from "@/shared/types/user.types"

interface LeadUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    executives: UserProfile[]
    onSuccess: () => void
}

export function LeadUploadDialog({ open, onOpenChange, executives, onSuccess }: LeadUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [selectedExecutive, setSelectedExecutive] = useState<string>("unassigned")
    const [isLoading, setIsLoading] = useState(false)
    const [previewCount, setPreviewCount] = useState<number>(0)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            
            // Preview count
            const data = await selectedFile.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet)
            setPreviewCount(jsonData.length)
        }
    }

    const [distributionMethod, setDistributionMethod] = useState<'manual' | 'round-robin'>('manual')

    const handleUpload = async () => {
        if (!file) return

        setIsLoading(true)
        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json<LeadUploadRow>(worksheet)

            const leadsToUpload = jsonData.map(row => ({
                name: row.Nombre || "Sin Nombre",
                phone: String(row.Telefono || ""),
                email: row.Email,
                amount: Number(row.Monto) || 0,
                status: 'nuevo' as const,
                assignedTo: distributionMethod === 'manual' && selectedExecutive !== "unassigned" ? selectedExecutive : undefined,
                source: 'excel-upload'
            }))

            const executiveIds = executives.map(e => e.uid)
            await leadsService.uploadLeads(leadsToUpload, distributionMethod, executiveIds)
            
            onSuccess()
            onOpenChange(false)
            setFile(null)
            setPreviewCount(0)
            setDistributionMethod('manual')
            setSelectedExecutive('unassigned')
        } catch (error) {
            console.error("Error uploading leads:", error)
            alert("Error al procesar el archivo. Verifique el formato.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cargar Base de Leads</DialogTitle>
                    <DialogDescription>
                        Sube un archivo Excel (.xlsx) con las columnas: Nombre, Telefono, Email, Monto.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Archivo Excel</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="file" 
                                accept=".xlsx, .xls" 
                                onChange={handleFileChange}
                            />
                        </div>
                        {previewCount > 0 && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                {previewCount} leads detectados
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Método de Asignación</Label>
                        <Select 
                            value={distributionMethod} 
                            onValueChange={(val: 'manual' | 'round-robin') => setDistributionMethod(val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar Método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="manual">Manual / Sin Asignar</SelectItem>
                                <SelectItem value="round-robin">Distribución Equitativa (Round Robin)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {distributionMethod === 'manual' && (
                        <div className="grid gap-2">
                            <Label>Asignar a (Opcional)</Label>
                            <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Ejecutivo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">-- Sin Asignar --</SelectItem>
                                    {executives.map(exec => (
                                        <SelectItem key={exec.uid} value={exec.uid}>
                                            {exec.displayName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleUpload} disabled={!file || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Upload className="mr-2 h-4 w-4" />
                        Cargar Leads
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
