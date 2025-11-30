import { Home, Users, LogOut, ChevronRight, PhoneCall, type LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useAuth } from "@/shared/context/auth-context"
import { Link, useLocation } from "react-router-dom"
import type { UserRole } from "@/shared/types/user.types"

// Menu items.
interface MenuItem {
    title: string
    url: string
    icon?: LucideIcon
    allowedRoles?: UserRole[]
    items?: {
        title: string
        url: string
        icon?: LucideIcon
        allowedRoles?: UserRole[]
    }[]
}

const items: { main: MenuItem[] } = {
    main: [
        {
          title: "Dashboard",
          url: "/",
          icon: Home,
        },
        {
          title: "Call Center",
          url: "/call-center",
          icon: PhoneCall,
          allowedRoles: ['supervisor', 'administrator'],
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
          allowedRoles: ['administrator'],
        },
    ],
}

export function AppSidebar() {
    const { user, logout } = useAuth()
    const location = useLocation()

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.main.map((item) => {
                                if (item.allowedRoles && user && !item.allowedRoles.includes(user.role)) {
                                    return null
                                }

                                if (item.items) {
                                    return (
                                        <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items.map((subItem) => {
                                                            if (subItem.allowedRoles && user && !subItem.allowedRoles.includes(user.role)) {
                                                                return null
                                                            }
                                                            return (
                                                                <SidebarMenuSubItem key={subItem.title}>
                                                                    <SidebarMenuSubButton
                                                                        asChild
                                                                        isActive={location.pathname === subItem.url}
                                                                    >
                                                                        <Link to={subItem.url}>
                                                                            {subItem.icon && <subItem.icon />}
                                                                            <span>{subItem.title}</span>
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            )
                                                        })}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    )
                                }

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                            <Link to={item.url}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <LogOut />
                            <span>Cerrar Sesión</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
