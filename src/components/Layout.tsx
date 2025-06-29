
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Building2 } from "lucide-react";
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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className={`${isMobile ? 'h-14' : 'h-16'} border-b bg-white flex items-center justify-between ${isMobile ? 'px-3' : 'px-6'}`}>
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <Building2 className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-red-600`} />
                <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-sm truncate max-w-32' : 'text-base'}`}>
                  Algum Africa Capitals LLP
                </h1>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2 md:gap-4">
                {!isMobile && (
                  <span className="text-sm text-gray-600 truncate max-w-32">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                )}
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "sm"}
                  onClick={handleSignOut}
                  className="flex items-center gap-1 md:gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {!isMobile && <span>Sign Out</span>}
                </Button>
              </div>
            )}
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
