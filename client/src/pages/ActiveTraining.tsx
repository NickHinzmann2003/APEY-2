import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dumbbell, ChevronRight, Loader2, Minus, Plus,
  CheckCircle2, Circle, Trophy, ArrowLeft, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayWithExercises, WeightHistoryDialog } from "@/components/training";

type ExerciseState = {
  repsAchieved: boolean;
  completed: boolean;
};

function ActiveExerciseCard({
  exercise,
  state,
  onToggleReps,
  onComplete,
  onChartOpen,
}: {
  exercise: Exercise;
  state: ExerciseState;
  onToggleReps: () => void;
  onComplete: () => void;
  onChartOpen: (ex: Exercise) => void;
}) {
  const { toast } = useToast();

  const incrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/increment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Gewicht gesteigert" });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/decrement`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Gewicht reduziert" });
    },
  });

  const isPending = incrementMutation.isPending || decrementMutation.isPending;

  if (state.completed) {
    return (
      <div
        data-testid={`active-exercise-${exercise.id}`}
        className="border border-primary/20 rounded-2xl bg-primary/5 px-4 py-3 flex items-center gap-3 opacity-60"
      >
        <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{exercise.name}</p>
          <p className="text-sm text-muted-foreground">
            {exercise.weight} kg · {state.repsAchieved ? "Wdh geschafft" : "Wdh nicht geschafft"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`active-exercise-${exercise.id}`}
      className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base leading-tight truncate">{exercise.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="text-foreground font-medium">{exercise.sets}</span> Sätze ·{" "}
            <span className="text-foreground font-medium">{exercise.repsMin}–{exercise.repsMax}</span> Wdh
          </p>
        </div>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground active:bg-primary/10 active:text-primary"
          onClick={() => onChartOpen(exercise)}
          data-testid={`btn-chart-active-${exercise.id}`}
        >
          <BarChart2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-3 pb-2">
        <button
          className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 text-red-400 active:bg-red-500/25 disabled:opacity-40 transition-colors font-semibold text-sm"
          onClick={() => decrementMutation.mutate()}
          disabled={isPending || exercise.weight <= 0}
          data-testid={`btn-decrement-active-${exercise.id}`}
        >
          <Minus className="w-4 h-4" />
          <span>{exercise.increment} kg</span>
        </button>

        <div className="flex-[1.4] h-12 flex flex-col items-center justify-center rounded-xl bg-white/8 border border-white/10">
          <span className="font-display font-bold text-xl leading-tight text-foreground">
            {exercise.weight}
          </span>
          <span className="text-xs text-muted-foreground leading-none">kg</span>
        </div>

        <button
          className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl bg-green-500/10 text-green-400 active:bg-green-500/25 disabled:opacity-40 transition-colors font-semibold text-sm"
          onClick={() => incrementMutation.mutate()}
          disabled={isPending}
          data-testid={`btn-increment-active-${exercise.id}`}
        >
          <Plus className="w-4 h-4" />
          <span>{exercise.increment} kg</span>
        </button>
      </div>

      <div className="px-3 pb-3 space-y-2">
        <button
          onClick={onToggleReps}
          data-testid={`btn-toggle-reps-${exercise.id}`}
          className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
            state.repsAchieved
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-white/5 text-muted-foreground border border-white/10"
          }`}
        >
          {state.repsAchieved
            ? <><CheckCircle2 className="w-5 h-5" /> Wiederholungen geschafft</>
            : <><Circle className="w-5 h-5" /> Wiederholungen geschafft?</>
          }
        </button>

        <Button
          className="w-full h-12 text-base shadow-lg shadow-primary/20"
          onClick={onComplete}
          data-testid={`btn-complete-exercise-${exercise.id}`}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Übung abschließen
        </Button>
      </div>
    </div>
  );
}

export function ActiveTraining() {
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [exerciseStates, setExerciseStates] = useState<Record<number, ExerciseState>>({});
  const [chartExercise, setChartExercise] = useState<Exercise | null>(null);

  const { data: allDays, isLoading } = useQuery<DayWithExercises[]>({
    queryKey: ["/api/all-training-days"],
  });

  const selectedDay = allDays?.find(d => d.id === selectedDayId);

  const toggleReps = (exerciseId: number) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        repsAchieved: !prev[exerciseId]?.repsAchieved,
        completed: prev[exerciseId]?.completed ?? false,
      },
    }));
  };

  const completeExercise = (exerciseId: number) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        repsAchieved: prev[exerciseId]?.repsAchieved ?? false,
        completed: true,
      },
    }));
  };

  const startTraining = (dayId: number) => {
    setSelectedDayId(dayId);
    setExerciseStates({});
  };

  const endTraining = () => {
    setSelectedDayId(null);
    setExerciseStates({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedDay) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Training starten</h1>
          <p className="text-muted-foreground text-sm">Wähle einen Trainingstag aus</p>
        </div>

        {(!allDays || allDays.length === 0) ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">Keine Trainingstage</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Erstelle zuerst Trainingspläne und -tage, bevor du ein Training starten kannst.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allDays.map(day => (
              <button
                key={day.id}
                onClick={() => startTraining(day.id)}
                data-testid={`btn-start-day-${day.id}`}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border border-white/8 bg-white/5 active:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Dumbbell className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-base truncate">{day.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.exercises.length} {day.exercises.length === 1 ? "Übung" : "Übungen"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const totalExercises = selectedDay.exercises.length;
  const completedCount = selectedDay.exercises.filter(ex => exerciseStates[ex.id]?.completed).length;
  const allDone = completedCount === totalExercises && totalExercises > 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={endTraining}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground active:bg-white/10"
          data-testid="btn-back-to-days"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold truncate">{selectedDay.name}</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-training-progress">
            {completedCount}/{totalExercises} Übungen abgeschlossen
          </p>
        </div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-2 mb-5">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0}%` }}
        />
      </div>

      {allDone ? (
        <div className="text-center py-16 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in zoom-in-95 duration-300">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Training abgeschlossen!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Du hast alle {totalExercises} Übungen absolviert.
          </p>
          <Button className="h-12 px-8 text-base" onClick={endTraining} data-testid="btn-finish-training">
            Fertig
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedDay.exercises.map(ex => (
            <ActiveExerciseCard
              key={ex.id}
              exercise={ex}
              state={exerciseStates[ex.id] ?? { repsAchieved: false, completed: false }}
              onToggleReps={() => toggleReps(ex.id)}
              onComplete={() => completeExercise(ex.id)}
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
