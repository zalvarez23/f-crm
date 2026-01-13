import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LeadsBySubstatusChartProps {
    data: Record<string, number>
}

// Mapping for pretty labels
const substatusLabels: Record<string, string> = {
    'contactado__contestacion': 'Contestación',
    'contactado__interesado': 'Interesado',
    'contactado__no_interesado': 'No Interesado',
    'contactado__venta_cerrada': 'Venta Cerrada',
    'contactado__cita': 'Cita Agendada',
    'contactado__aprobado': 'Aprobado',
    'no_contactado__buzon': 'Buzón de Voz',
    'no_contactado__numero_errado': 'Número Errado',
    'no_contactado__no_contesta': 'No Contesta',
    'no_contactado__colgo': 'Colgó',
    'rechazado__rechazado': 'Rechazado'
}

export function LeadsBySubstatusChart({ data }: LeadsBySubstatusChartProps) {
    // Process data to match labels
    const chartData = Object.entries(data)
        .filter(([key]) => substatusLabels[key]) // Only show known substatuses
        .map(([key, value]) => ({
            name: substatusLabels[key],
            value: value,
            fill: key.startsWith('contactado') ? '#10b981' : '#f59e0b' // Green for contacted, Amber for others
        }))
        .sort((a, b) => b.value - a.value) // Sort descending

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Detalle por Sub-estado</CardTitle>
                <CardDescription>Motivos de contacto y resultados</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={chartData} margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={120}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[0, 4, 4, 0]} 
                                barSize={24}
                                label={{ position: 'right', fill: '#666', fontSize: 12 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
