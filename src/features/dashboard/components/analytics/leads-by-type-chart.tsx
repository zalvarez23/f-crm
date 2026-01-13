import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LeadsByTypeChartProps {
    data: { loan: number; investment: number }
}

export function LeadsByTypeChart({ data }: LeadsByTypeChartProps) {
    const chartData = [
        { name: "Préstamos", value: data.loan, color: "#2563eb" }, // blue-600
        { name: "Inversiones", value: data.investment, color: "#db2777" }, // pink-600
    ]

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Leads por Tipo</CardTitle>
                <CardDescription>Préstamos vs Inversiones</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
