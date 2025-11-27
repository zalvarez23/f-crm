import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./components/layout/app-layout"
import { ThemeProvider } from "./shared/hooks/useTheme"
import DashboardPage from "./features/dashboard/dashboard-page"
import ClientsPage from "./features/clients/clients-page"
import ReportsPage from "./features/reports/reports-page"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="f-crm-theme">
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
