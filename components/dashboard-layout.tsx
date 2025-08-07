"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bike,
  BarChart3,
  Map,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Overview",
    icon: BarChart3,
    href: "/",
  },
  {
    title: "Trip Analytics",
    icon: TrendingUp,
    href: "/trips",
  },
  {
    title: "Station Map",
    icon: Map,
    href: "/stations",
  },
  {
    title: "Usage Patterns",
    icon: Calendar,
    href: "/patterns",
  },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/">
                    <Bike className="h-6 w-6" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">Indego Dashboard</span>
                      <span className="text-xs text-muted-foreground">
                        Philadelphia Bike Share
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="text-xs text-muted-foreground p-4">
              Data provided by Indego
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="border-b">
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">Indego Data Dashboard</h1>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}