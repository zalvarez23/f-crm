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
  SidebarHeader,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Circle } from "lucide-react"
import type { UserStatus } from "@/shared/types/user.types"
import { StatusTimer } from "@/shared/components/status-timer"

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
          allowedRoles: ['supervisor', 'administrator', 'loan_executive'],
        },
        {
          title: "Tasaciones",
          url: "/tasaciones",
          icon: ChevronRight,
          allowedRoles: ['investment_executive', 'supervisor'],
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
          allowedRoles: ['administrator'],
        },
    ],
}

const roleLabels: Record<UserRole, string> = {
    loan_executive: 'Ejecutivo de Préstamos',
    supervisor: 'Supervisor',
    administrator: 'Administrador',
    legal: 'Legal',
    commercial: 'Comercial',
    closer: 'Closer',
    appraisal_manager: 'Gestor de Tasación',
    investment_executive: 'Ejecutivo de Inversiones'
}

const statusConfig: Record<UserStatus, { label: string, color: string, bg: string, text: string }> = {
    available: { 
        label: 'Disponible', 
        color: 'bg-green-500', 
        bg: 'bg-green-50 dark:bg-green-950/30', 
        text: 'text-green-700 dark:text-green-400' 
    },
    bathroom: { 
        label: 'Baño', 
        color: 'bg-accent', 
        bg: 'bg-accent/10', 
        text: 'text-accent font-bold' 
    },
    lunch: { 
        label: 'Almuerzo', 
        color: 'bg-orange-500', 
        bg: 'bg-orange-50 dark:bg-orange-950/30', 
        text: 'text-orange-700 dark:text-orange-400' 
    },
    break: { 
        label: 'Pausa Activa', 
        color: 'bg-yellow-500', 
        bg: 'bg-yellow-50 dark:bg-yellow-950/30', 
        text: 'text-yellow-700 dark:text-yellow-400' 
    },
    meeting: { 
        label: 'Reunión', 
        color: 'bg-purple-500', 
        bg: 'bg-purple-50 dark:bg-purple-950/30', 
        text: 'text-purple-700 dark:text-purple-400' 
    },
    end_shift: { 
        label: 'Fin de Turno', 
        color: 'bg-red-500', 
        bg: 'bg-red-50 dark:bg-red-950/30', 
        text: 'text-red-700 dark:text-red-400' 
    }
}

export function AppSidebar() {
    const { user, logout, updateStatus } = useAuth()
    const location = useLocation()

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    return (
        <Sidebar>
            <SidebarHeader>
                {user && (
                    <div className="flex flex-col gap-4 p-4 pb-2">
                        <div className="px-1 py-1">
                            <h2 className="text-lg font-bold tracking-tight text-[#0c2648] flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-accent" />
                                Intercapital Perú
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border shadow-sm">
                                <AvatarImage src={user.photoURL} alt={user.displayName} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {getInitials(user.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                <span className="text-sm font-semibold leading-none truncate">
                                    {user.displayName || "Usuario"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate font-medium">
                                    {roleLabels[user.role]}
                                </span>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`w-full justify-between h-9 px-3 border shadow-sm transition-all duration-200 ${statusConfig[user.status || 'available'].bg} ${statusConfig[user.status || 'available'].text} border-current/10 hover:border-current/30 hover:${statusConfig[user.status || 'available'].bg}`}
                                >
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <div className={`h-2.5 w-2.5 rounded-full ${statusConfig[user.status || 'available'].color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                                        <span className="text-xs font-semibold truncate uppercase tracking-wider">
                                            {statusConfig[user.status || 'available'].label}
                                        </span>
                                        {user.statusUpdatedAt && (
                                            <StatusTimer 
                                                timestamp={user.statusUpdatedAt} 
                                                className="ml-auto bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-bold"
                                            />
                                        )}
                                    </div>
                                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[200px] p-1.5 shadow-xl border-muted-foreground/20">
                                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest px-2 py-2">
                                    Cambiar Estado
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="my-1" />
                                {(Object.entries(statusConfig) as [UserStatus, typeof statusConfig[UserStatus]][]).map(([key, config]) => (
                                    <DropdownMenuItem 
                                        key={key}
                                        onSelect={() => updateStatus(key)}
                                        className={`gap-3 cursor-pointer flex items-center justify-between rounded-md px-2 py-2 mb-0.5 last:mb-0 transition-colors ${user.status === key || (!user.status && key === 'available') ? config.bg + ' ' + config.text : 'hover:bg-muted text-foreground'}`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`h-2.5 w-2.5 rounded-full ${config.color} shadow-sm`} />
                                            <span className="text-sm font-medium">{config.label}</span>
                                        </div>
                                        {user.status === key && (
                                            <Circle className="h-1.5 w-1.5 fill-current" />
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator className="mt-1" />
                    </div>
                )}
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
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
                {user && (
                    <div className="p-4 pt-0">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    onClick={logout} 
                                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
