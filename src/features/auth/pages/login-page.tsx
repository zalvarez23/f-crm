import { LoginForm } from "../components/login-form"
import { PhoneCall } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c2648]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c2648] via-[#183662] to-[#0c2648] opacity-90" />
      <div className="relative w-full max-w-md space-y-8 rounded-2xl bg-white/95 backdrop-blur-sm p-10 shadow-2xl border border-white/10 mx-4">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <PhoneCall className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0c2648]">
            Intercapital Perú
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Accede a tu plataforma de gestión
          </p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  )
}
