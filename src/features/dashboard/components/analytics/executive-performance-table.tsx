import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PerformanceData {
    userId: string
    displayName: string
    role: string
    onlineMinutes: number
    breakMinutes: number
    lastStatus: string
}

interface ExecutivePerformanceTableProps {
    data: PerformanceData[]
}

const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
}

const statusColorMap: Record<string, string> = {
    available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    lunch: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    break: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    bathroom: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    end_shift: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

export function ExecutivePerformanceTable({ data }: ExecutivePerformanceTableProps) {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Rendimiento del Equipo (Hoy)</CardTitle>
                <CardDescription>Tiempo de conexión vs tiempos de pausa</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ejecutivo</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado Actual</TableHead>
                            <TableHead className="text-right">Tiempo Online</TableHead>
                            <TableHead className="text-right">Tiempo Break</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((user) => (
                                <TableRow key={user.userId}>
                                    <TableCell className="font-medium">{user.displayName}</TableCell>
                                    <TableCell className="capitalize">{user.role?.replace('_', ' ') || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge className={`border-none shadow-none ${statusColorMap[user.lastStatus] || 'bg-gray-100 text-gray-800'}`}>
                                            {user.lastStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-green-600">
                                        {formatMinutes(user.onlineMinutes)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-orange-600">
                                        {formatMinutes(user.breakMinutes)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay actividad registrada hoy.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
