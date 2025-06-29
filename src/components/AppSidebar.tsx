
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
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const isCollapsed = state === "collapsed";

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-red-100 text-red-800 font-medium border-r-2 border-red-600" 
      : "hover:bg-gray-100 text-gray-700";

  return (
    <Sidebar 
      className={`${isCollapsed ? "w-14" : isMobile ? "w-64" : "w-64"} flex-shrink-0`} 
      collapsible="icon"
      variant={isMobile ? "floating" : "sidebar"}
    >
      <SidebarContent className="bg-white border-r overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-600 font-semibold truncate">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`${isMobile ? "h-12 text-base" : "h-10"} w-full`}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) => `${getNavClassName({ isActive })} flex items-center gap-2 w-full`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {(!isCollapsed || isMobile) && (
                        <span className="truncate">{item.title}</span>
                      )}
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
