import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PipelineStageChartProps {
    legalStats: { pending: number; approved: number; rejected: number }
    commercialStats: { pending: number; approved: number; rejected: number }
}

export function PipelineStageChart({ legalStats, commercialStats }: PipelineStageChartProps) {
    const chartData = [
        {
            name: "Pendiente",
            Legal: legalStats.pending,
            Comercial: commercialStats.pending
        },
        {
            name: "Aprobado",
            Legal: legalStats.approved,
            Comercial: commercialStats.approved
        },
        {
            name: "Rechazado",
            Legal: legalStats.rejected,
            Comercial: commercialStats.rejected
        }
    ]

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Pipeline de Aprobaciones</CardTitle>
                <CardDescription>Comparativo Legal vs Comercial</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
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
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Bar dataKey="Legal" fill="#8b5cf6" radius={[4, 4, 0, 0]} /> 
                            <Bar dataKey="Comercial" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
