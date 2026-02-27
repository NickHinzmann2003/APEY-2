import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, X } from "lucide-react";
import { AngularDumbbell } from "@/components/icons/AngularDumbbell";
import { useToast } from "@/hooks/use-toast";
import {
  DayWithExercises,
  TrainingDayItem,
  WeightHistoryDialog,
} from "@/components/training";

export function DaysPage() {
  const { toast } = useToast();
  const [chartExercise, setChartExercise] = useState<Exercise | null>(null);
  const [newDayName, setNewDayName] = useState("");
  const [isAddingDay, setIsAddingDay] = useState(false);

  const { data: standaloneDays, isLoading } = useQuery<DayWithExercises[]>({
    queryKey: ["/api/training-days"],
  });

  const createDayMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/training-days", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      setNewDayName("");
      setIsAddingDay(false);
      toast({ title: "Trainingstag erstellt" });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-days/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      toast({ title: "Trainingstag gelöscht" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmpty = (standaloneDays?.length ?? 0) === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Trainingstage</h1>
        <p className="text-muted-foreground text-sm">Einzelne Trainingstage ohne Plan</p>
      </div>

      {isEmpty && !isAddingDay ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <AngularDumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">Noch keine Trainingstage</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
            Erstelle einzelne Trainingstage, die keinem Plan zugeordnet sind.
          </p>
          <Button className="h-12 text-base" onClick={() => setIsAddingDay(true)} data-testid="btn-create-first-day">
            <Plus className="w-4 h-4 mr-2" /> Trainingstag erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-base font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <AngularDumbbell className="w-4 h-4" />
              Einzelne Tage
            </h2>
            {!isAddingDay && (
              <button
                className="flex items-center gap-1 text-sm font-medium text-primary active:opacity-70 px-3 py-2 rounded-xl"
                onClick={() => setIsAddingDay(true)}
                data-testid="btn-create-standalone-day"
              >
                <Plus className="w-4 h-4" /> Neuer Tag
              </button>
            )}
          </div>

          {isAddingDay && (
            <div className="flex gap-2 p-3 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in duration-200">
              <Input
                placeholder="z.B. Beine, Rücken, Brust..."
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="bg-background border-white/10 h-12 text-base flex-1"
                data-testid="input-standalone-day-name"
                onKeyDown={(e) => e.key === "Enter" && newDayName && createDayMutation.mutate(newDayName)}
                autoFocus
              />
              <Button
                className="h-12 px-4 shrink-0"
                onClick={() => createDayMutation.mutate(newDayName)}
                disabled={!newDayName || createDayMutation.isPending}
                data-testid="btn-confirm-create-day"
              >
                {createDayMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={() => setIsAddingDay(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {standaloneDays?.map((day) => (
            <TrainingDayItem
              key={day.id}
              day={day}
              onDelete={() => deleteDayMutation.mutate(day.id)}
              onChartOpen={setChartExercise}
            />
          ))}
        </div>
      )}

      {chartExercise && (
        <WeightHistoryDialog
          exercise={chartExercise}
          onClose={() => setChartExercise(null)}
        />
      )}
    </div>
  );
}
