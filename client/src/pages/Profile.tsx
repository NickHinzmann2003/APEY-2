import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, User as UserIcon, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { ApexLogo } from "@/components/icons/ApexLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function Profile() {
  const { user, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/account"),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen des Accounts", variant: "destructive" });
    },
  });

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

      <div className="border border-white/10 rounded-2xl bg-white/5 p-6 text-center mb-6">
        <ApexLogo className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="font-display font-bold text-lg"><span className="text-primary">APEX</span> by Nick</p>
        <p className="text-muted-foreground text-sm mt-1">Dein persönlicher Trainingsplan-Tracker</p>
      </div>

      <div className="border border-destructive/20 rounded-2xl bg-destructive/5 p-5">
        <h3 className="font-display font-bold text-base mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Gefahrenzone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Lösche deinen Account und alle zugehörigen Daten unwiderruflich.
        </p>
        <Button
          variant="destructive"
          className="w-full h-12 text-base"
          onClick={() => setShowDeleteAccount(true)}
          data-testid="btn-delete-account"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Account löschen
        </Button>
      </div>

      <Dialog open={showDeleteAccount} onOpenChange={(v) => { if (!v) { setShowDeleteAccount(false); setConfirmText(""); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm bg-zinc-900 border-white/10 rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              Account wirklich löschen?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Alle deine Trainingspläne, Übungen, Statistiken und Logs werden unwiderruflich gelöscht. Tippe "LÖSCHEN" ein, um zu bestätigen.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Tippe "LÖSCHEN"'
            className="bg-background border-white/10 h-12 text-base mt-2"
            data-testid="input-confirm-delete-account"
          />
          <DialogFooter className="flex gap-2 mt-2 sm:flex-row">
            <Button variant="ghost" className="flex-1 h-11" onClick={() => { setShowDeleteAccount(false); setConfirmText(""); }} data-testid="btn-cancel-delete-account">
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={confirmText !== "LÖSCHEN" || deleteAccountMutation.isPending}
              data-testid="btn-confirm-delete-account"
            >
              {deleteAccountMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
