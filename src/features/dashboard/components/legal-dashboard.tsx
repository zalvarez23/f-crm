import { useState, useEffect } from "react"
import { PhoneCall, CheckCircle, XCircle, Clock } from "lucide-react"
import { leadsService } from "@/features/leads/services/leads.service"
import { useAuth } from "@/shared/context/auth-context"
import type { Lead } from "@/features/leads/types/leads.types"
import { LeadsTable } from "@/features/leads/components/leads-table"
import { LegalReviewDialog } from "@/features/leads/components/legal-review-dialog"
import { DashboardStats } from "./dashboard-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function LegalDashboard() {
    const { user } = useAuth()
    const [allLeads, setAllLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (user) {
            loadMyLeads()
        }
    }, [user])

    const loadMyLeads = async () => {
        if (!user) return
        
        try {
            const myLeads = await leadsService.getLeadsByExecutive(user.uid)
            setAllLeads(myLeads)
        } catch (error) {
            console.error("Error loading leads:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead)
        setIsDialogOpen(true)
    }

    const handleReviewSuccess = () => {
        loadMyLeads() // Refresh leads after review
    }

    // Filter leads by legal status
    const pendingLeads = allLeads.filter(lead => lead.legalStatus === 'pending_review')
    const approvedLeads = allLeads.filter(lead => lead.legalStatus === 'approved')
    const rejectedLeads = allLeads.filter(lead => lead.legalStatus === 'rejected')

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Legal Dashboard</h2>
                <p className="text-muted-foreground">
                    Revisa y aprueba/rechaza leads transferidos para validación legal
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardStats
                    title="Total Leads"
                    value={loading ? "..." : allLeads.length}
                    description="Total leads asignados"
                    icon={PhoneCall}
                    iconColor="text-blue-500"
                />
                <DashboardStats
                    title="Pendientes"
                    value={loading ? "..." : pendingLeads.length}
                    description="Esperando revisión"
                    icon={Clock}
                    iconColor="text-yellow-500"
                />
                <DashboardStats
                    title="Aprobados"
                    value={loading ? "..." : approvedLeads.length}
                    description="Leads aprobados"
                    icon={CheckCircle}
                    iconColor="text-green-500"
                />
                <DashboardStats
                    title="Rechazados"
                    value={loading ? "..." : rejectedLeads.length}
                    description="Leads rechazados"
                    icon={XCircle}
                    iconColor="text-red-500"
                />
            </div>

            {/* Leads Tabs */}
            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">
                        Pendientes ({pendingLeads.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                        Aprobados ({approvedLeads.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                        Rechazados ({rejectedLeads.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    {loading ? (
                        <p>Cargando leads pendientes...</p>
                    ) : pendingLeads.length > 0 ? (
                        <LeadsTable leads={pendingLeads} onLeadClick={handleLeadClick} />
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">
                                    No hay leads pendientes de revisión
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4">
                    {loading ? (
                        <p>Cargando leads aprobados...</p>
                    ) : approvedLeads.length > 0 ? (
                        <LeadsTable leads={approvedLeads} onLeadClick={handleLeadClick} />
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">
                                    No hay leads aprobados aún
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                    {loading ? (
                        <p>Cargando leads rechazados...</p>
                    ) : rejectedLeads.length > 0 ? (
                        <LeadsTable leads={rejectedLeads} onLeadClick={handleLeadClick} />
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground">
                                    No hay leads rechazados
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            <LegalReviewDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                lead={selectedLead}
                onSuccess={handleReviewSuccess}
            />
        </div>
    )
}
