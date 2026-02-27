import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExerciseTemplate, DEFAULT_CATEGORIES } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Dumbbell, X, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/training";

export function ExercisesPage() {
  const { toast } = useToast();
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ExerciseTemplate | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const { data: templates, isLoading } = useQuery<ExerciseTemplate[]>({
    queryKey: ["/api/exercise-templates"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; category: string }) => apiRequest("POST", "/api/exercise-templates", data),
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

  const allCategories = [...DEFAULT_CATEGORIES];
  templates?.forEach(t => {
    if (t.category && !allCategories.includes(t.category)) {
      allCategories.push(t.category);
    }
  });

  const grouped = new Map<string, ExerciseTemplate[]>();
  for (const cat of allCategories) {
    grouped.set(cat, []);
  }
  const uncategorized: ExerciseTemplate[] = [];
  templates?.forEach(t => {
    if (t.category && grouped.has(t.category)) {
      grouped.get(t.category)!.push(t);
    } else if (t.category) {
      if (!grouped.has(t.category)) grouped.set(t.category, []);
      grouped.get(t.category)!.push(t);
    } else {
      uncategorized.push(t);
    }
  });

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

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
            <div className="p-3 border border-primary/20 rounded-2xl bg-primary/5 space-y-3 animate-in fade-in duration-200">
              <Input
                placeholder="z.B. Bankdrücken, Klimmzüge..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background border-white/10 h-12 text-base"
                data-testid="input-template-name"
                onKeyDown={(e) => e.key === "Enter" && newName.trim() && createMutation.mutate({ name: newName.trim(), category: newCategory })}
                autoFocus
              />
              <div className="flex gap-1.5 flex-wrap">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    data-testid={`btn-category-${cat}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      newCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/8 text-muted-foreground active:bg-white/15"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 h-11"
                  onClick={() => createMutation.mutate({ name: newName.trim(), category: newCategory })}
                  disabled={!newName.trim() || createMutation.isPending}
                  data-testid="btn-confirm-create-template"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Anlegen
                </Button>
                <Button variant="ghost" className="h-11 px-4" onClick={() => setIsAdding(false)} data-testid="btn-cancel-create-template">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {Array.from(grouped.entries()).map(([cat, items]) => {
            if (items.length === 0 && !isAdding) return null;
            const isCollapsed = collapsedCategories.has(cat);
            return (
              <div key={cat} className="border border-white/8 rounded-2xl overflow-hidden bg-zinc-900/40">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 active:bg-white/5 transition-colors"
                  data-testid={`btn-toggle-category-${cat}`}
                >
                  <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60">{items.length}</span>
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {!isCollapsed && items.length > 0 && (
                  <div className="border-t border-white/5 px-2 pb-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {items.map(t => (
                      <div
                        key={t.id}
                        data-testid={`template-${t.id}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Dumbbell className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium text-sm truncate" data-testid={`text-template-name-${t.id}`}>{t.name}</span>
                        </div>
                        <button
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground active:text-destructive active:bg-destructive/10 shrink-0"
                          onClick={() => setTemplateToDelete(t)}
                          data-testid={`btn-delete-template-${t.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {uncategorized.length > 0 && (
            <div className="border border-white/8 rounded-2xl overflow-hidden bg-zinc-900/40">
              <div className="px-4 py-3">
                <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Sonstige</span>
              </div>
              <div className="border-t border-white/5 px-2 pb-2 space-y-1">
                {uncategorized.map(t => (
                  <div
                    key={t.id}
                    data-testid={`template-${t.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Dumbbell className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-sm truncate" data-testid={`text-template-name-${t.id}`}>{t.name}</span>
                    </div>
                    <button
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground active:text-destructive active:bg-destructive/10 shrink-0"
                      onClick={() => setTemplateToDelete(t)}
                      data-testid={`btn-delete-template-${t.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
