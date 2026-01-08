import { useAuth } from "@/shared/context/auth-context"
import { SupervisorDashboard } from "./components/supervisor-dashboard"
import { ExecutiveDashboard } from "./components/executive-dashboard"
import { LegalDashboard } from "./components/legal-dashboard"
import { CommercialDashboard } from "./components/commercial-dashboard"
import { CloserDashboard } from "./components/closer-dashboard"
import { AppraisalDashboard } from "./components/appraisal-dashboard"
import { InvestmentDashboard } from "./components/investment-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  // Show Executive Dashboard for loan executives
  if (user.role === 'loan_executive') {
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

  // Show Closer Dashboard for closer users
  if (user.role === 'closer') {
    return <CloserDashboard />
  }

  // Show Appraisal Dashboard for appraisal managers
  if (user.role === 'appraisal_manager') {
    return <AppraisalDashboard />
  }

  // Show Investment Dashboard for investment executives
  if (user.role === 'investment_executive') {
    return <InvestmentDashboard />
  }

  // Show Supervisor Dashboard for supervisors and administrators
  return <SupervisorDashboard />
}
