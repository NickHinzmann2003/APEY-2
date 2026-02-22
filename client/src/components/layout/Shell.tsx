import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Dumbbell, LogOut, User as UserIcon } from "lucide-react";

export function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Dumbbell className="h-6 w-6" />
            <span className="font-display font-bold text-xl tracking-wider uppercase">
              PROJECT <span className="text-foreground">ADONIS</span>
            </span>
          </Link>
          
          {user && (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>{user.firstName || user.email?.split('@')[0]}</span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-2xl">
        {children}
      </main>
      
      <footer className="py-6 border-t border-white/5 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Project Adonis. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
