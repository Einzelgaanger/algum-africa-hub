
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  FolderOpen, 
  Plus, 
  Activity, 
  BarChart3, 
  Settings 
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
  },
  {
    title: "New Project",
    url: "/projects/new",
    icon: Plus,
  },
  {
    title: "Activity Logs",
    url: "/logs",
    icon: Activity,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();

  const isCollapsed = state === "collapsed";

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-red-100 text-red-800 font-medium border-r-2 border-red-600" 
      : "hover:bg-gray-100 text-gray-700";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r">
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-600 font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) => getNavClassName({ isActive })}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
