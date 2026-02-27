import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise, WorkoutLog } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTraining } from "@/hooks/use-training";
import {
  Dumbbell, Loader2, Minus, Plus,
  CheckCircle2, Circle, Trophy, ArrowLeft, BarChart2, Clock, Play, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayWithExercises, WeightHistoryDialog } from "@/components/training";

type TrainingStatus = {
  lastTrainedByPlan: Record<number, { dayId: number; dayName: string; trainedAt: string }>;
  suggestedDay: { id: number; name: string; planId: number; planName: string; exerciseCount: number } | null;
};

function LastPerformancePreview({ exerciseId }: { exerciseId: number }) {
  const { data: lastLog, isLoading } = useQuery<WorkoutLog | null>({
    queryKey: ["/api/exercises", exerciseId, "last-workout"],
    queryFn: () => fetch(`/api/exercises/${exerciseId}/last-workout`, { credentials: "include" }).then(r => r.json()),
  });

  if (isLoading) return null;
  if (!lastLog) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-sm text-muted-foreground" data-testid={`last-workout-${exerciseId}`}>
      <Clock className="w-4 h-4 shrink-0 text-primary/60" />
      <span>
        Letztes Mal: <span className="text-foreground font-medium">{lastLog.weight} kg</span>
        {" · "}
        <span className="text-foreground font-medium">{lastLog.setsCompleted}/{lastLog.totalSets}</span> Sätze
      </span>
    </div>
  );
}

function ExpandedExerciseCard({
  exercise,
  setsState,
  onToggleSet,
  onComplete,
  onChartOpen,
}: {
  exercise: Exercise;
  setsState: boolean[];
  onToggleSet: (setIndex: number) => void;
  onComplete: () => void;
  onChartOpen: (ex: Exercise) => void;
}) {
  const { toast } = useToast();

  const incrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/increment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      toast({ title: "Gewicht gesteigert" });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/decrement`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      toast({ title: "Gewicht reduziert" });
    },
  });

  const isPending = incrementMutation.isPending || decrementMutation.isPending;
  const completedSets = setsState.filter(Boolean).length;

  return (
    <div
      data-testid={`active-exercise-${exercise.id}`}
      className="border border-primary/30 rounded-2xl bg-primary/5 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-lg leading-tight truncate">{exercise.name}</p>
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

      <div className="px-3 pb-2">
        <LastPerformancePreview exerciseId={exercise.id} />
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

      <div className="px-3 pb-2">
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {setsState.map((done, i) => (
            <button
              key={i}
              onClick={() => onToggleSet(i)}
              data-testid={`btn-set-${exercise.id}-${i}`}
              className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold transition-all ${
                done
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-white/5 text-muted-foreground border border-white/10"
              }`}
            >
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              Satz {i + 1}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1.5">
          {completedSets}/{exercise.sets} Sätze abgehakt
        </p>
      </div>

      <div className="px-3 pb-3 space-y-2">
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

function CollapsedExerciseCard({ exercise, completed, setsCompleted, totalSets, onGoBack }: {
  exercise: Exercise;
  completed: boolean;
  setsCompleted: number;
  totalSets: number;
  onGoBack?: () => void;
}) {
  return (
    <div
      data-testid={`collapsed-exercise-${exercise.id}`}
      className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
        completed
          ? "border-primary/20 bg-primary/5 opacity-60"
          : "border-white/8 bg-white/5 opacity-50"
      }`}
    >
      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{exercise.name}</p>
        {completed && (
          <p className="text-xs text-muted-foreground">
            {setsCompleted}/{totalSets} Sätze
          </p>
        )}
      </div>
      {completed && onGoBack && (
        <button
          onClick={onGoBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground active:text-primary active:bg-primary/10 shrink-0"
          data-testid={`btn-goback-${exercise.id}`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function ActiveTraining() {
  const training = useTraining();
  const { state, setSelectedDayId, setActiveIndex, setSetsMap, setCompletedSet, initSetsForDay, endTraining } = training;
  const { selectedDayId, activeIndex, setsMap, completedSet } = state;

  const [chartExercise, setChartExercise] = useState<Exercise | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { toast } = useToast();

  const { data: allDays, isLoading: daysLoading } = useQuery<DayWithExercises[]>({
    queryKey: ["/api/all-training-days"],
  });

  const { data: trainingStatus, isLoading: statusLoading } = useQuery<TrainingStatus>({
    queryKey: ["/api/training-status"],
  });

  const logMutation = useMutation({
    mutationFn: (data: { exerciseId: number; weight: number; setsCompleted: number; totalSets: number; repsAchieved: boolean }) =>
      apiRequest("POST", "/api/workout-logs", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", variables.exerciseId, "last-workout"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-status"] });
    },
  });

  const selectedDay = allDays?.find(d => d.id === selectedDayId);

  useEffect(() => {
    if (initialized || !allDays) return;
    const params = new URLSearchParams(window.location.search);
    const dayIdParam = params.get("dayId");
    if (dayIdParam) {
      const dayId = parseInt(dayIdParam);
      const day = allDays.find(d => d.id === dayId);
      if (day) {
        setSelectedDayId(dayId);
        initSetsForDay(day.exercises);
      }
      window.history.replaceState({}, "", "/training");
    }
    setInitialized(true);
  }, [allDays, initialized]);

  const toggleSet = (exerciseId: number, setIndex: number) => {
    setSetsMap((prev: Record<number, boolean[]>) => {
      const arr = [...(prev[exerciseId] || [])];
      arr[setIndex] = !arr[setIndex];
      return { ...prev, [exerciseId]: arr };
    });
  };

  const completeExercise = (exercise: Exercise) => {
    const sets = setsMap[exercise.id] || [];
    const setsCompleted = sets.filter(Boolean).length;

    logMutation.mutate({
      exerciseId: exercise.id,
      weight: exercise.weight,
      setsCompleted,
      totalSets: exercise.sets,
      repsAchieved: false,
    });

    setCompletedSet((prev: Set<number>) => {
      const next = new Set(prev);
      next.add(exercise.id);
      return next;
    });

    if (selectedDay) {
      const nextIdx = activeIndex + 1;
      if (nextIdx < selectedDay.exercises.length) {
        setActiveIndex(nextIdx);
      }
    }
  };

  const goBackToExercise = (exerciseId: number) => {
    if (!selectedDay) return;
    const idx = selectedDay.exercises.findIndex(e => e.id === exerciseId);
    if (idx === -1) return;
    setCompletedSet((prev: Set<number>) => {
      const next = new Set(prev);
      next.delete(exerciseId);
      return next;
    });
    setSetsMap((prev: Record<number, boolean[]>) => ({
      ...prev,
      [exerciseId]: new Array(selectedDay.exercises[idx].sets).fill(false),
    }));
    setActiveIndex(idx);
  };

  const startTraining = (dayId: number) => {
    const day = allDays?.find(d => d.id === dayId);
    if (day) {
      setSelectedDayId(dayId);
      initSetsForDay(day.exercises);
    }
  };

  const isLoading = daysLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedDay) {
    const suggested = trainingStatus?.suggestedDay;

    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">Training</h1>
          <p className="text-muted-foreground text-sm">Dein nächstes Training</p>
        </div>

        {suggested ? (
          <div className="border border-primary/20 rounded-2xl bg-primary/5 p-5 animate-in fade-in duration-300" data-testid="suggested-training">
            <p className="text-xs font-bold uppercase tracking-wider text-primary/70 mb-3">Vorschlag</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-xl leading-tight truncate" data-testid="text-suggested-day">{suggested.name}</p>
                <p className="text-sm text-muted-foreground" data-testid="text-suggested-plan">
                  {suggested.planName} · {suggested.exerciseCount} {suggested.exerciseCount === 1 ? "Übung" : "Übungen"}
                </p>
              </div>
            </div>
            <Button
              className="w-full h-12 text-base shadow-lg shadow-primary/20"
              onClick={() => startTraining(suggested.id)}
              data-testid="btn-start-suggested"
            >
              <Play className="w-5 h-5 mr-2" /> Training starten
            </Button>
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <Dumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-display font-semibold mb-2">Kein Training verfügbar</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Erstelle zuerst Trainingspläne mit Übungen, dann wird dir hier dein nächstes Training vorgeschlagen.
            </p>
          </div>
        )}
      </div>
    );
  }

  const totalExercises = selectedDay.exercises.length;
  const completedCount = completedSet.size;
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
        <div className="space-y-2">
          {selectedDay.exercises.map((ex, idx) => {
            const isActive = idx === activeIndex && !completedSet.has(ex.id);
            const isCompleted = completedSet.has(ex.id);

            if (isActive) {
              return (
                <ExpandedExerciseCard
                  key={ex.id}
                  exercise={ex}
                  setsState={setsMap[ex.id] || new Array(ex.sets).fill(false)}
                  onToggleSet={(setIdx) => toggleSet(ex.id, setIdx)}
                  onComplete={() => completeExercise(ex)}
                  onChartOpen={setChartExercise}
                />
              );
            }

            return (
              <CollapsedExerciseCard
                key={ex.id}
                exercise={ex}
                completed={isCompleted}
                setsCompleted={(setsMap[ex.id] || []).filter(Boolean).length}
                totalSets={ex.sets}
                onGoBack={isCompleted ? () => goBackToExercise(ex.id) : undefined}
              />
            );
          })}
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
