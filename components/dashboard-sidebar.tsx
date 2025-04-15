"use client"

import { useState } from "react"
import { Users, Star, Home, LogOut, UserPlus } from "lucide-react"
import type { ActiveView } from "@/app/dashboard/page"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// Extend Window interface to include handleViewChange
declare global {
  interface Window {
    handleViewChange?: (view: ActiveView) => void
  }
}

interface SidebarProps {
  onLogout: () => Promise<void>
}

export function DashboardSidebar({ onLogout }: SidebarProps) {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard")

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      view: "dashboard" as ActiveView,
    },
    {
      title: "Teams",
      icon: Users,
      view: "teams" as ActiveView,
    },
    {
      title: "Reviews",
      icon: Star,
      view: "reviews" as ActiveView,
    },
    {
      title: "Add Staff",
      icon: UserPlus,
      view: "add-staff" as ActiveView,
    },
  ]

  const handleViewChange = (view: ActiveView) => {
    setActiveView(view)
    // Call the function exposed by the dashboard page
    if (window.handleViewChange) {
      window.handleViewChange(view)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center p-2">
          <SidebarTrigger className="md:hidden mr-2" />
          <h2 className="text-xl font-bold">Staff Portal</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={activeView === item.view}
                onClick={() => handleViewChange(item.view)}
              >
                <button>
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout}>
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
