import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTraining } from "@/hooks/use-training";
import { Link, useLocation } from "wouter";
import {
  ClipboardList, ListChecks,
  BarChart2, User as UserIcon
} from "lucide-react";
import { ApexLogo } from "@/components/icons/ApexLogo";

function BottomNav() {
  const [location] = useLocation();
  const { isTrainingActive } = useTraining();

  const tabs = [
    { href: "/plans", icon: ClipboardList, label: "Pläne" },
    { href: "/exercises", icon: ListChecks, label: "Übungen" },
    { href: "/training", icon: ApexLogo, label: "Training", isCenter: true },
    { href: "/analytics", icon: BarChart2, label: "Statistik" },
    { href: "/profile", icon: UserIcon, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-end justify-around gap-1 max-w-2xl mx-auto h-16 px-2 pb-1">
        {tabs.map(tab => {
          const isActive = location === tab.href || (tab.href === "/plans" && location === "/");
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-testid="nav-training"
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary/30"
                    : isTrainingActive
                      ? "bg-primary/30 text-primary shadow-primary/20"
                      : "bg-white/10 text-muted-foreground"
                }`}>
                  <Icon className="w-7 h-7" />
                  {isTrainingActive && !isActive && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-testid={`nav-${tab.href.slice(1)}`}
              className="flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px]"
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] mt-1 font-semibold transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
          <Link href="/plans" className="flex items-center hover:opacity-80 transition-opacity" data-testid="link-home">
            <ApexLogo className="h-9 w-9 text-primary -mr-1" />
            <span className="font-display font-bold text-lg tracking-wider uppercase">
              <span className="text-primary">PEX</span> <span className="text-foreground">by Nick</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-5 max-w-2xl pb-24">
        {children}
      </main>

      {user && <BottomNav />}
    </div>
  );
}
