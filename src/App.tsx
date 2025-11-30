import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AppLayout } from "./components/layout/app-layout"
import { ThemeProvider } from "./shared/hooks/useTheme"
import { AuthProvider } from "./shared/context/auth-context"
import { ProtectedRoute } from "./shared/components/protected-route"
import DashboardPage from "./features/dashboard/dashboard-page"
import ClientsPage from "./features/clients/clients-page"
import ReportsPage from "./features/reports/reports-page"
import LoginPage from "./features/auth/pages/login-page"
import UsersPage from "./features/users/pages/users-page"
import { CallCenterPage } from "./features/call-center/pages/call-center-page"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="f-crm-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={
              <ProtectedRoute>
                <AppLayout>
                  <Outlet />
                </AppLayout>
              </ProtectedRoute>
            }>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <UsersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/call-center" 
                element={
                  <ProtectedRoute allowedRoles={['supervisor', 'administrator']}>
                    <CallCenterPage />
                  </ProtectedRoute>
                } 
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
