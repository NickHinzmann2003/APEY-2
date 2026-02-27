import { useAuth } from "@/hooks/use-auth";
import { LogOut, User as UserIcon, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Profile() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Profil</h1>
        <p className="text-muted-foreground text-sm">Dein Konto und Einstellungen</p>
      </div>

      <div className="border border-white/10 rounded-2xl bg-white/5 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profilbild"
                className="w-16 h-16 rounded-full object-cover"
                data-testid="img-profile"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-bold truncate" data-testid="text-username">
              {user?.firstName || user?.email?.split("@")[0] || "Benutzer"}
            </p>
            {user?.email && (
              <p className="text-sm text-muted-foreground truncate" data-testid="text-email">{user.email}</p>
            )}
          </div>
        </div>

        <Button
          variant="destructive"
          className="w-full h-12 text-base"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="btn-logout"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Abmelden
        </Button>
      </div>

      <div className="border border-white/10 rounded-2xl bg-white/5 p-6 text-center">
        <Dumbbell className="w-8 h-8 text-primary mx-auto mb-3" />
        <p className="font-display font-bold text-lg">APEX by Nick</p>
        <p className="text-muted-foreground text-sm mt-1">Dein persönlicher Trainingsplan-Tracker</p>
      </div>
    </div>
  );
}
