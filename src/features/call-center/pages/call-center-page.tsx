import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Plus, User, Database } from "lucide-react"
import { LeadUploadDialog } from "@/features/leads/components/lead-upload-dialog"
import { LeadDialog } from "@/features/leads/components/lead-dialog"
import { usersService } from "@/features/users/services/users.service"
import { leadsService } from "@/features/leads/services/leads.service"
import type { UserProfile } from "@/shared/types/user.types"

export function CallCenterPage() {
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [executives, setExecutives] = useState<UserProfile[]>([])
    const [executiveLeadCounts, setExecutiveLeadCounts] = useState<{ executiveId: string; count: number }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Load executives
            const allUsers = await usersService.getAll()
            const execs = allUsers.filter(u => u.role === 'loan_executive' || u.role === 'investment_executive')
            setExecutives(execs)

            // Load lead counts per executive
            const counts = await leadsService.getLeadsByExecutiveCount()
            setExecutiveLeadCounts(counts)
        } catch (error) {
            console.error("Error loading call center data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLeadCreated = () => {
        alert("Lead created successfully")
        loadData() // Refresh data
    }

    const handleLeadsUploaded = () => {
        alert("Leads uploaded successfully")
        loadData() // Refresh data
    }

    const handleSeedLeads = async () => {
        const confirm = window.confirm("¿Deseas cargar leads de prueba para ambos tipos de ejecutivos?")
        if (!confirm) return

        setLoading(true)
        try {
            const mockLeads = [
                { name: "Juan Préstamos", phone: "999000111", amount: 50000, email: "juan@test.com" },
                { name: "Maria Inversiones", phone: "999000222", amount: 150000, email: "maria@test.com" }
            ]

            // Loan lead
            await leadsService.createLead({
                ...mockLeads[0],
                status: 'nuevo',
                leadType: 'loan',
                source: 'manual'
            }, 'random')

            // Investment lead
            await leadsService.createLead({
                ...mockLeads[1],
                status: 'nuevo',
                leadType: 'investment',
                source: 'manual'
            }, 'random')

            alert("Leads de prueba creados satisfactoriamente")
            loadData()
        } catch (error) {
            console.error(error)
            alert("Error al crear leads de prueba")
        } finally {
            setLoading(false)
        }
    }

    const getLeadCountForExecutive = (executiveId: string): number => {
        const found = executiveLeadCounts.find(item => item.executiveId === executiveId)
        return found ? found.count : 0
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Call Center</h2>
                    <p className="text-muted-foreground">
                        Lead management and distribution
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={handleSeedLeads}>
                        <Database className="mr-2 h-4 w-4" />
                        Sembrar Prueba
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Lead
                    </Button>
                    <Button onClick={() => setIsUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Excel
                    </Button>
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
