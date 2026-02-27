import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExerciseTemplate } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Dumbbell, X, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/training";

export function ExercisesPage() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ExerciseTemplate | null>(null);

  const { data: templates, isLoading } = useQuery<ExerciseTemplate[]>({
    queryKey: ["/api/exercise-templates"],
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/exercise-templates", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      setNewName("");
      setIsAdding(false);
      toast({ title: "Übung angelegt" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/exercise-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      toast({ title: "Übung gelöscht" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmpty = (templates?.length ?? 0) === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Übungen</h1>
        <p className="text-muted-foreground text-sm">Deine Übungs-Bibliothek</p>
      </div>

      {isEmpty && !isAdding ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">Noch keine Übungen</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
            Lege Übungen an, die du dann in deinen Trainingstagen verwenden kannst.
          </p>
          <Button className="h-12 text-base" onClick={() => setIsAdding(true)} data-testid="btn-create-first-template">
            <Plus className="w-4 h-4 mr-2" /> Übung anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-base font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Dumbbell className="w-4 h-4" />
              Bibliothek
            </h2>
            {!isAdding && (
              <button
                className="flex items-center gap-1 text-sm font-medium text-primary active:opacity-70 px-3 py-2 rounded-xl"
                onClick={() => setIsAdding(true)}
                data-testid="btn-add-template"
              >
                <Plus className="w-4 h-4" /> Neue Übung
              </button>
            )}
          </div>

          {isAdding && (
            <div className="flex gap-2 p-3 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in duration-200">
              <Input
                placeholder="z.B. Bankdrücken, Klimmzüge..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background border-white/10 h-12 text-base flex-1"
                data-testid="input-template-name"
                onKeyDown={(e) => e.key === "Enter" && newName.trim() && createMutation.mutate(newName.trim())}
                autoFocus
              />
              <Button
                className="h-12 px-4 shrink-0"
                onClick={() => createMutation.mutate(newName.trim())}
                disabled={!newName.trim() || createMutation.isPending}
                data-testid="btn-confirm-create-template"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={() => setIsAdding(false)} data-testid="btn-cancel-create-template">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {templates?.map(t => (
            <div
              key={t.id}
              data-testid={`template-${t.id}`}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-white/8 bg-white/5"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Dumbbell className="w-5 h-5 text-primary shrink-0" />
                <span className="font-semibold text-base truncate" data-testid={`text-template-name-${t.id}`}>{t.name}</span>
              </div>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground active:text-destructive active:bg-destructive/10 shrink-0"
                onClick={() => setTemplateToDelete(t)}
                data-testid={`btn-delete-template-${t.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        onConfirm={() => {
          if (templateToDelete) {
            deleteMutation.mutate(templateToDelete.id);
            setTemplateToDelete(null);
          }
        }}
        isPending={deleteMutation.isPending}
        title="Übung löschen?"
        description={`Möchtest du "${templateToDelete?.name}" wirklich aus der Bibliothek löschen?`}
      />
    </div>
  );
}
