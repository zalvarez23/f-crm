import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LeadsByStatusChartProps {
    data: Record<string, number>
}

export function LeadsByStatusChart({ data }: LeadsByStatusChartProps) {
    const chartData = [
        { name: "Nuevo", value: data.nuevo || 0, fill: "#3b82f6" }, // blue-500
        { name: "Contactado", value: data.contactado || 0, fill: "#f59e0b" }, // amber-500
        { name: "Cita", value: data.cita || 0, fill: "#10b981" }, // emerald-500
        { name: "Rechazado", value: data.rechazado || 0, fill: "#ef4444" }, // red-500
    ]

    // Filter out zero values if desired, or keep to show 0
    // chartData = chartData.filter(d => d.value > 0)

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Leads por Estado</CardTitle>
                <CardDescription>Distribución actual de leads</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#888888" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar 
                                dataKey="value" 
                                radius={[4, 4, 0, 0]} 
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
