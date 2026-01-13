import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Plus, User, Database } from "lucide-react"
import { LeadUploadDialog } from "@/features/leads/components/lead-upload-dialog"
import { LeadDialog } from "@/features/leads/components/lead-dialog"
import { usersService } from "@/features/users/services/users.service"
import { leadsService } from "@/features/leads/services/leads.service"
import type { UserProfile, UserStatus } from "@/shared/types/user.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusTimer } from "@/shared/components/status-timer"
import { useAuth } from "@/shared/context/auth-context"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LeadDetailDialog } from "@/features/leads/components/lead-detail-dialog"
import type { Lead } from "@/features/leads/types/leads.types"
import { toast } from "sonner"

export function CallCenterPage() {
    const { user } = useAuth()
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [executives, setExecutives] = useState<UserProfile[]>([])
    const [executiveLeadCounts, setExecutiveLeadCounts] = useState<{ executiveId: string; count: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [myLeads, setMyLeads] = useState<Lead[]>([])
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const isManager = user?.role === 'supervisor' || user?.role === 'administrator'

    useEffect(() => {
        // Subscribe to real-time user updates
        const unsubscribe = usersService.subscribeToUsers((allUsers) => {
            const execs = allUsers.filter(u => u.role === 'loan_executive' || u.role === 'investment_executive')
            setExecutives(execs)
            
            // Note: Lead counts still need to be refreshed manually or on events
            // We'll keep the loadLeadCounts logic separate or triggered here
            loadLeadCounts()
        })
        return () => unsubscribe()
    }, [])

    const loadLeadCounts = async () => {
        try {
            if (isManager) {
                const counts = await leadsService.getLeadsByExecutiveCount()
                setExecutiveLeadCounts(counts)
            } else if (user) {
                const leads = await leadsService.getLeadsByExecutive(user.uid)
                setMyLeads(leads)
            }
        } catch (error) {
            console.error("Error loading lead counts:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadData = () => {
        loadLeadCounts()
    }

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    const statusConfig: Record<UserStatus, { label: string, color: string, bg: string, text: string }> = {
        available: { label: 'Disponible', color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400' },
        bathroom: { label: 'Baño', color: 'bg-accent', bg: 'bg-accent/10', text: 'text-accent font-bold' },
        lunch: { label: 'Almuerzo', color: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' },
        break: { label: 'Pausa Activa', color: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400' },
        meeting: { label: 'Reunión', color: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
        end_shift: { label: 'Fin de Turno', color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400' }
    }

    const handleLeadCreated = () => {
        toast.success("Lead creado exitosamente")
        loadData() // Refresh data
    }

    const handleLeadsUploaded = () => {
        toast.success("Leads cargados exitosamente")
        loadData() // Refresh data
    }

    const handleSeedLeads = async () => {
        const confirm = window.confirm("¿Deseas cargar leads de prueba para ambos tipos de ejecutivos?")
        if (!confirm) return

        setLoading(true)
        try {
            const names = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Miguel", "Lucia"]
            const lastnames = ["Perez", "Gomez", "Lopez", "Rodriguez", "Martinez", "Fernandez", "Gonzalez", "Diaz"]
            
            const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
            const getRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

            // Generate 5 random leads
            for (let i = 0; i < 5; i++) {
                const isLoan = Math.random() > 0.5
                const name = `${getRandomElement(names)} ${getRandomElement(lastnames)}`
                const phone = `9${getRandomNumber(10000000, 99999999)}`
                
                await leadsService.createLead({
                    name,
                    phone,
                    amount: isLoan ? getRandomNumber(5000, 50000) : getRandomNumber(20000, 200000),
                    email: `${name.toLowerCase().replace(" ", ".")}@test.com`,
                    status: 'nuevo',
                    leadType: isLoan ? 'loan' : 'investment',
                    source: 'manual'
                }, 'random')
            }

            toast.success("✅ 5 Leads de prueba creados exitosamente en Firebase")
            loadData()
        } catch (error) {
            console.error(error)
            toast.error("❌ Error al crear leads de prueba")
        } finally {
            setLoading(false)
        }
    }

    const getLeadCountForExecutive = (executiveId: string): number => {
        const found = executiveLeadCounts.find(item => item.executiveId === executiveId)
        return found ? found.count : 0
    }

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Call Center</h2>
                    <p className="text-muted-foreground">
                        {isManager 
                            ? "Gestión de leads y distribución del equipo" 
                            : "Gestiona tus leads asignados y seguimiento"}
                    </p>
                </div>
                {isManager && (
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleSeedLeads}>
                            <Database className="mr-2 h-4 w-4" />
                            Sembrar Prueba
                        </Button>
                        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Lead
                        </Button>
                        <Button onClick={() => setIsUploadOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Cargar Excel
                        </Button>
                    </div>
                )}
            </div>

            {isManager ? (
                <>
                    {/* My Team Status Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Estado del Equipo</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {loading ? (
                                <p>Cargando disponibilidad...</p>
                            ) : executives.length > 0 ? (
                                executives.map(exec => {
                                    const status = exec.status || 'available'
                                    const config = statusConfig[status]
                                    
                                    return (
                                        <div key={exec.uid} className="rounded-xl border shadow-sm p-4 bg-card transition-all hover:shadow-md">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border shadow-sm">
                                                        <AvatarImage src={exec.photoURL} alt={exec.displayName} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                            {getInitials(exec.displayName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col gap-0.5 overflow-hidden">
                                                        <h4 className="font-bold truncate">{exec.displayName || "Usuario"}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{exec.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`flex items-center gap-1.5 px-2 py-0.5 border-none shadow-none font-bold text-[10px] uppercase tracking-wider ${config.bg} ${config.text}`}
                                                    >
                                                        <div className={`h-1.5 w-1.5 rounded-full ${config.color}`} />
                                                        {config.label}
                                                    </Badge>
                                                    {exec.statusUpdatedAt && (
                                                        <StatusTimer 
                                                            timestamp={exec.statusUpdatedAt} 
                                                            className="bg-muted px-1.5 py-0.5 rounded font-bold"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className="text-muted-foreground col-span-full">No hay ejecutivos conectados.</p>
                            )}
                        </div>
                    </div>

                    {/* Executive Lead Distribution */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Lead Distribution by Executive</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {loading ? (
                                <p>Loading distribution...</p>
                            ) : executives.length > 0 ? (
                                executives.map(exec => {
                                    const leadCount = getLeadCountForExecutive(exec.uid)
                                    return (
                                        <Card key={exec.uid}>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">
                                                    {exec.displayName}
                                                    <span className="ml-2 text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground uppercase">
                                                        {exec.role === 'loan_executive' ? 'Préstamos' : 'Inversiones'}
                                                    </span>
                                                </CardTitle>
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{leadCount}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    {leadCount === 1 ? 'Lead assigned' : 'Leads assigned'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {exec.email}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            ) : (
                                <p className="text-muted-foreground col-span-full">No hay ejecutivos registrados.</p>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Tus Leads Asignados</h3>
                    <div className="rounded-md border p-4 bg-card">
                        {loading ? (
                            <p>Cargando leads...</p>
                        ) : (
                            <LeadsTable leads={myLeads} onLeadClick={handleLeadClick} />
                        )}
                    </div>
                </div>
            )}

            <LeadDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                lead={selectedLead}
                onSuccess={loadData}
            />

            <LeadUploadDialog 
                open={isUploadOpen} 
                onOpenChange={setIsUploadOpen} 
                executives={executives}
                onSuccess={handleLeadsUploaded}
            />

            <LeadDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                executives={executives}
                onSuccess={handleLeadCreated}
            />
        </div>
    )
}
