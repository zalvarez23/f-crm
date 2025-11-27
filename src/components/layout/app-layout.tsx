import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ThemeToggle } from "@/shared/components/theme-toggle"

interface AppLayoutProps {
    children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 overflow-auto">
                <div className="border-b">
                    <div className="flex h-16 items-center justify-between px-4">
                        <SidebarTrigger />
                        <ThemeToggle />
                    </div>
                </div>
                <div className="p-8">{children}</div>
            </main>
        </SidebarProvider>
    )
}
