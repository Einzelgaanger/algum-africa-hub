
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className={`${isMobile ? 'h-14' : 'h-16'} border-b bg-white flex items-center justify-between ${isMobile ? 'px-2' : 'px-6'} flex-shrink-0`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <SidebarTrigger className="flex-shrink-0" />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <img 
                  src="/logo.svg" 
                  alt="CollabSpace" 
                  className={`${isMobile ? 'h-8' : 'h-10'} w-auto flex-shrink-0`}
                />
                <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CollabSpace
                </span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isMobile && (
                  <span className="text-sm text-gray-600 truncate max-w-32">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  {!isMobile && <span className="whitespace-nowrap">Sign Out</span>}
                </Button>
              </div>
            )}
          </header>
          
          <main className="flex-1 overflow-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
