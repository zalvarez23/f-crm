import { useAuth } from "@/shared/context/auth-context"
import { SupervisorDashboard } from "./components/supervisor-dashboard"
import { ExecutiveDashboard } from "./components/executive-dashboard"
import { LegalDashboard } from "./components/legal-dashboard"
import { CommercialDashboard } from "./components/commercial-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  // Show Executive Dashboard for executives
  if (user.role === 'executive') {
    return <ExecutiveDashboard />
  }

  // Show Legal Dashboard for legal users
  if (user.role === 'legal') {
    return <LegalDashboard />
  }

  // Show Commercial Dashboard for commercial users
  if (user.role === 'commercial') {
    return <CommercialDashboard />
  }

  // Show Supervisor Dashboard for supervisors and administrators
  return <SupervisorDashboard />
}
