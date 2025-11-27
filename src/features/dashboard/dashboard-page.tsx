export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Bienvenido al panel de control del CRM
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-muted-foreground">Total Clientes</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-muted-foreground">Nuevos este mes</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-muted-foreground">Reportes generados</p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <div className="text-2xl font-bold">100%</div>
                    <p className="text-sm text-muted-foreground">Tasa de éxito</p>
                </div>
            </div>
        </div>
    )
}
