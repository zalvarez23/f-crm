import { 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Settings, 
  Scale, 
  Briefcase, 
  CheckCircle2, 
  Home,
  Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const roles = [
  {
    id: "administrator",
    title: "Administrador",
    icon: Settings,
    color: "text-red-600",
    bg: "bg-red-50",
    description: "Control total del sistema, gestión de usuarios y configuraciones globales."
  },
  {
    id: "supervisor",
    title: "Supervisor",
    icon: ShieldCheck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: "Monitoreo de equipos, asignación de leads y seguimiento de objetivos."
  },
  {
    id: "loan_executive",
    title: "Ejecutivo de Préstamos",
    icon: Users,
    color: "text-green-600",
    bg: "bg-green-50",
    description: "Gestión de prestatarios, primer contacto y seguimiento de solicitudes de crédito."
  },
  {
    id: "investment_executive",
    title: "Ejecutivo de Inversiones",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    description: "Captación y gestión de inversionistas para el financiamiento de proyectos."
  },
  {
    id: "legal",
    title: "Legal",
    icon: Scale,
    color: "text-purple-600",
    bg: "bg-purple-50",
    description: "Revisión técnica, legal de garantías y validación de contratos."
  },
  {
    id: "commercial",
    title: "Comercial",
    icon: Briefcase,
    color: "text-amber-600",
    bg: "bg-amber-50",
    description: "Evaluación de viabilidad comercial y validación de condiciones de préstamo."
  },
  {
    id: "appraisal_manager",
    title: "Gestor de Tasación",
    icon: Home,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    description: "Coordinación y validación de tasaciones comerciales de inmuebles."
  },
  {
    id: "closer",
    title: "Cerrador",
    icon: CheckCircle2,
    color: "text-slate-600",
    bg: "bg-slate-50",
    description: "Cierre presencial, firma de escrituras y formalización de operaciones."
  }
]

export function RoleGuide() {
  return (
    <Card className="border border-slate-200 dark:border-[#183662] shadow-sm bg-white/50 dark:bg-[#0c2648]/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 dark:text-slate-200">
          <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          Guía de Roles y Responsabilidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className="flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-[#183662]/40 border border-slate-100 dark:border-[#183662]/60 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-md ${role.bg} dark:bg-opacity-10`}>
                  <role.icon className={`h-4 w-4 ${role.color}`} />
                </div>
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">{role.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
