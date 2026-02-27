import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Dumbbell, Folder, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  PlanWithDays,
  TrainingPlanSection,
  WeightHistoryDialog,
} from "@/components/training";

type TrainingStatus = {
  lastTrainedByPlan: Record<number, { dayId: number; dayName: string; trainedAt: string }>;
  suggestedDay: { id: number; name: string; planId: number; planName: string; exerciseCount: number } | null;
};

export function PlansPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [chartExercise, setChartExercise] = useState<Exercise | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  const { data: plans, isLoading } = useQuery<PlanWithDays[]>({
    queryKey: ["/api/training-plans"],
  });

  const { data: trainingStatus } = useQuery<TrainingStatus>({
    queryKey: ["/api/training-status"],
  });

  const createPlanMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/training-plans", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      setNewPlanName("");
      setIsAddingPlan(false);
      toast({ title: "Trainingsplan erstellt" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-status"] });
      toast({ title: "Trainingsplan gelöscht" });
    },
  });

  const handleStartTraining = (dayId: number) => {
    navigate(`/training?dayId=${dayId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isEmpty = (plans?.length ?? 0) === 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Trainingspläne</h1>
        <p className="text-muted-foreground text-sm">Erstelle und verwalte deine Pläne</p>
      </div>

      {isEmpty && !isAddingPlan ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">Noch keine Pläne</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
            Erstelle einen Trainingsplan (z.B. Upper/Lower, Push Pull Legs).
          </p>
          <Button className="h-12 text-base" onClick={() => setIsAddingPlan(true)} data-testid="btn-create-first-plan">
            <Folder className="w-4 h-4 mr-2" /> Trainingsplan erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-base font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Folder className="w-4 h-4" />
              Pläne
            </h2>
            {!isAddingPlan && (
              <button
                className="flex items-center gap-1 text-sm font-medium text-primary active:opacity-70 px-3 py-2 rounded-xl"
                onClick={() => setIsAddingPlan(true)}
                data-testid="btn-create-plan"
              >
                <Plus className="w-4 h-4" /> Neuer Plan
              </button>
            )}
          </div>

          {isAddingPlan && (
            <div className="flex gap-2 p-3 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in duration-200">
              <Input
                placeholder="z.B. Upper / Lower, Push Pull Legs..."
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="bg-background border-white/10 h-12 text-base flex-1"
                data-testid="input-plan-name"
                onKeyDown={(e) => e.key === "Enter" && newPlanName && createPlanMutation.mutate(newPlanName)}
                autoFocus
              />
              <Button
                className="h-12 px-4 shrink-0"
                onClick={() => createPlanMutation.mutate(newPlanName)}
                disabled={!newPlanName || createPlanMutation.isPending}
                data-testid="btn-confirm-create-plan"
              >
                {createPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={() => setIsAddingPlan(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {plans?.map((plan) => (
            <TrainingPlanSection
              key={plan.id}
              plan={plan}
              onDelete={() => deletePlanMutation.mutate(plan.id)}
              onChartOpen={setChartExercise}
              lastTrainedDayId={trainingStatus?.lastTrainedByPlan[plan.id]?.dayId ?? null}
              onStartTraining={handleStartTraining}
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
