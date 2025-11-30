import { LoginForm } from "../components/login-form"
import { seedSupervisor } from "@/utils/seed-user"
import { seedLeads } from "@/utils/seed-leads"

export default function LoginPage() {
  const handleSeedSupervisor = async () => {
    await seedSupervisor()
  }

  const handleSeedLeads = async () => {
    await seedLeads()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>
        
        <LoginForm />
        
        {/* Temporary seed buttons */}
        <div className="mt-4 text-center space-y-2">
          <button
            onClick={handleSeedSupervisor}
            className="block w-full text-xs text-gray-500 hover:text-gray-700"
          >
            Seed Users (Dev Only)
          </button>
          <button
            onClick={handleSeedLeads}
            className="block w-full text-xs text-blue-500 hover:text-blue-700 font-semibold"
          >
            🌱 Create 3 Test Leads
          </button>
        </div>
      </div>
    </div>
  )
}
