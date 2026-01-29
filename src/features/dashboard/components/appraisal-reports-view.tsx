import { useState, useEffect } from "react"
import { Search, Phone, Mail, MapPin, Download, UserPlus, FileText, UserMinus } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import type { Lead } from "@/features/leads/types/leads.types"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function AppraisalReportsView() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
    const [investorDNI, setInvestorDNI] = useState("")
    const [investorName, setInvestorName] = useState("")
    const [investorPhone, setInvestorPhone] = useState("")
    const [searchingInvestor, setSearchingInvestor] = useState(false)
    const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "unassigned">("all")
    const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false)

    useEffect(() => {
        loadAppraisals()
    }, [])

    useEffect(() => {
        const lowerSearch = search.toLowerCase()
        let filtered = leads.filter(lead => 
            lead.name.toLowerCase().includes(lowerSearch) || 
            lead.email?.toLowerCase().includes(lowerSearch) ||
            lead.phone.toLowerCase().includes(lowerSearch)
        )

        if (statusFilter === "assigned") {
            filtered = filtered.filter(lead => lead.appraisal?.investorName)
        } else if (statusFilter === "unassigned") {
            filtered = filtered.filter(lead => !lead.appraisal?.investorName)
        }

        setFilteredLeads(filtered)
    }, [search, leads, statusFilter])

    const loadAppraisals = async () => {
        try {
            setLoading(true)
            const allLeads = await leadsService.getAllLeads()
            
            // Filter leads that have appraisal data (report, value, etc.)
            const appraisedLeads = allLeads.filter(lead => 
                lead.appraisal && (lead.appraisal.reportUrl || lead.appraisal.price)
            )
            
            setLeads(appraisedLeads)
        } catch (error) {
            console.error("Error loading appraisal reports:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead)
        setIsDialogOpen(true)
    }

    const handleAssignInvestor = (lead: Lead) => {
        setSelectedLead(lead)
        setInvestorDNI("")
        setInvestorName(lead.appraisal?.investorName || "")
        setInvestorPhone(lead.appraisal?.investorPhone || "")
        setIsAssignDialogOpen(true)
    }

    const handleSearchInvestorByDNI = async () => {
        if (!investorDNI.trim()) {
            toast.error("Por favor ingrese un DNI")
            return
        }

        try {
            setSearchingInvestor(true)
            const investorLead = await leadsService.searchLeadByIdentityDocument(investorDNI.trim())
            
            if (investorLead) {
                setInvestorName(investorLead.name)
                setInvestorPhone(investorLead.phone)
                toast.success("Inversionista encontrado")
            } else {
                toast.error("No se encontró ningún inversionista con ese DNI")
            }
        } catch (error) {
            console.error("Error searching investor:", error)
            toast.error("Error al buscar inversionista")
        } finally {
            setSearchingInvestor(false)
        }
    }

    const handleSaveInvestor = async () => {
        if (!selectedLead?.id || !investorName.trim() || !investorPhone.trim()) {
            toast.error("Por favor complete todos los campos")
            return
        }

        try {
            await leadsService.updateLead(selectedLead.id, {
                appraisal: {
                    ...selectedLead.appraisal,
                    investorName: investorName.trim(),
                    investorPhone: investorPhone.trim()
                }
            })
            setIsAssignDialogOpen(false)
            loadAppraisals()
            toast.success("Inversionista asignado exitosamente")
        } catch (error) {
            console.error("Error assigning investor:", error)
            toast.error("Error al asignar inversionista")
        }
    }

    const handleDownloadPDF = (reportUrl?: string) => {
        if (reportUrl) {
            window.open(reportUrl, '_blank')
        } else {
            toast.error("No hay reporte PDF disponible")
        }
    }

    const handleReleaseInvestor = async () => {
        if (!selectedLead?.id) return

        try {
            await leadsService.updateLead(selectedLead.id, {
                appraisal: {
                    ...selectedLead.appraisal,
                    investorName: "",
                    investorPhone: ""
                }
            })
            setIsReleaseDialogOpen(false)
            loadAppraisals()
            toast.success("Inversionista liberado exitosamente")
        } catch (error) {
            console.error("Error releasing investor:", error)
            toast.error("Error al liberar inversionista")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasaciones Realizadas</h2>
                    <p className="text-muted-foreground">
                        Reportes de tasación listos para asignación de inversionista
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, correo o teléfono..."
                        className="pl-10 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[200px] h-10">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Ver Todos</SelectItem>
                        <SelectItem value="assigned">Asignados</SelectItem>
                        <SelectItem value="unassigned">Sin Asignar</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Cards Grid */}
            {loading ? (
                <div className="py-12 text-center text-muted-foreground">Cargando reportes...</div>
            ) : filteredLeads.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredLeads.map((lead) => (
                        <Card key={lead.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Header */}
                            <CardHeader className="bg-primary/5 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <CardTitle className="text-lg">{lead.name}</CardTitle>
                                    </div>
                                    {lead.appraisal?.investorName ? (
                                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                            ASIGNADO
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                            DISPONIBLE
                                        </Badge>
                                    )}
                                </div>
                                {lead.appraisal?.completedAt && (
                                    <CardDescription className="text-xs">
                                        Completado: {new Date((lead.appraisal.completedAt as any).seconds * 1000).toLocaleDateString('es-PE')}
                                    </CardDescription>
                                )}
                            </CardHeader>

                            <CardContent className="p-6 space-y-4">
                                {/* Client Information */}
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">INFORMACIÓN DEL CLIENTE</h4>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{lead.phone}</span>
                                        </div>
                                        {lead.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="truncate">{lead.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Property Location */}
                                {(lead.department || lead.province || lead.district) && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">UBICACIÓN DE LA PROPIEDAD</h4>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            {lead.department && (
                                                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{lead.department}</span>
                                                </div>
                                            )}
                                            {lead.province && (
                                                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{lead.province}</span>
                                                </div>
                                            )}
                                            {lead.district && (
                                                <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{lead.district}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Appraisal Details */}
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">DETALLES DE TASACIÓN</h4>
                                    <div className="space-y-2">
                                        {lead.appraisal?.price && (
                                            <div className="flex justify-between items-center bg-primary/5 px-3 py-2 rounded">
                                                <span className="text-sm font-medium">Precio Tasación:</span>
                                                <span className="text-sm font-bold">S/ {lead.appraisal.price.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {lead.appraisal?.garagePrice && (
                                            <div className="flex justify-between items-center bg-primary/5 px-3 py-2 rounded">
                                                <span className="text-sm font-medium">Tasación Cochera:</span>
                                                <span className="text-sm font-bold">S/ {lead.appraisal.garagePrice.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {lead.appraisal?.area && (
                                            <div className="flex justify-between items-center bg-primary/5 px-3 py-2 rounded">
                                                <span className="text-sm font-medium">Área:</span>
                                                <span className="text-sm font-bold">{lead.appraisal.area} m²</span>
                                            </div>
                                        )}
                                        {lead.appraisal?.usage && (
                                            <div className="flex justify-between items-center bg-primary/5 px-3 py-2 rounded">
                                                <span className="text-sm font-medium">Uso:</span>
                                                <span className="text-sm font-bold">{lead.appraisal.usage}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Investor Info if assigned */}
                                {lead.appraisal?.investorName && (
                                    <div className="border-t pt-3">
                                        <h4 className="text-sm font-semibold text-green-700 mb-2">INVERSIONISTA ASIGNADO</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2">
                                                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="font-medium">{lead.appraisal.investorName}</span>
                                            </div>
                                            {lead.appraisal.investorPhone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{lead.appraisal.investorPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-2">
                                    {lead.appraisal?.reportUrl && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => handleDownloadPDF(lead.appraisal?.reportUrl)}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Descargar PDF
                                        </Button>
                                    )}
                                    <Button
                                        className="w-full bg-cyan-500 hover:bg-cyan-600"
                                        onClick={() => handleAssignInvestor(lead)}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        {lead.appraisal?.investorName ? 'Reasignar Inversionista' : 'Asignar Inversionista'}
                                    </Button>
                                    
                                    {lead.appraisal?.investorName && (
                                        <Button
                                            variant="outline"
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => {
                                                setSelectedLead(lead)
                                                setIsReleaseDialogOpen(true)
                                            }}
                                        >
                                            <UserMinus className="mr-2 h-4 w-4" />
                                            Liberar Inversionista
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        className="w-full text-xs"
                                        onClick={() => handleLeadClick(lead)}
                                    >
                                        Ver detalles completos
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-muted-foreground">
                    No se encontraron reportes de tasación.
                </div>
            )}

            {/* Lead Detail Dialog */}
            <LeadDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                lead={selectedLead}
                onSuccess={loadAppraisals}
            />

            {/* Assign Investor Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Inversionista</DialogTitle>
                        <DialogDescription>
                            Ingrese los datos del inversionista para {selectedLead?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="investorDNI">DNI del Inversionista</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="investorDNI"
                                    placeholder="Ingrese DNI para buscar..."
                                    value={investorDNI}
                                    onChange={(e) => setInvestorDNI(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearchInvestorByDNI()}
                                />
                                <Button 
                                    type="button" 
                                    variant="secondary"
                                    onClick={handleSearchInvestorByDNI}
                                    disabled={searchingInvestor}
                                >
                                    {searchingInvestor ? "..." : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="investorName">Nombre del Inversionista</Label>
                            <Input
                                id="investorName"
                                placeholder="Ej: Juan Pérez"
                                value={investorName}
                                onChange={(e) => setInvestorName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="investorPhone">Teléfono del Inversionista</Label>
                            <Input
                                id="investorPhone"
                                placeholder="Ej: +51 999 999 999"
                                value={investorPhone}
                                onChange={(e) => setInvestorPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveInvestor}>
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Release Investor Confirmation Dialog */}
            <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Liberar Inversionista</DialogTitle>
                        <DialogDescription>
                            ¿Está seguro de que desea liberar al inversionista de este reporte? 
                            El reporte volverá a estar disponible para asignación.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm font-medium">Inversionista actual: <span className="font-bold">{selectedLead?.appraisal?.investorName}</span></p>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsReleaseDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReleaseInvestor}
                        >
                            Confirmar Liberación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
