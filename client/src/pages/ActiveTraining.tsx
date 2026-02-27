import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Exercise, WorkoutLog } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTraining } from "@/hooks/use-training";
import {
  Loader2, Minus, Plus,
  CheckCircle2, Circle, Trophy, ArrowLeft, BarChart2, Clock, Play, RotateCcw, TrendingUp, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DayWithExercises, WeightHistoryDialog } from "@/components/training";
import { AngularDumbbell } from "@/components/icons/AngularDumbbell";

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

  let setWeightsArr: number[] = [];
  if (lastLog.setWeights) {
    try { setWeightsArr = JSON.parse(lastLog.setWeights); } catch {}
  }

  return (
    <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-sm" data-testid={`last-workout-${exerciseId}`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Clock className="w-4 h-4 shrink-0 text-primary/60" />
        <span className="font-medium text-xs uppercase tracking-wide">Letztes Mal</span>
      </div>
      {setWeightsArr.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 ml-6">
          {setWeightsArr.map((w, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-foreground font-medium">
              Satz {i + 1}: {w} kg
            </span>
          ))}
        </div>
      ) : (
        <div className="ml-6">
          <span className="text-foreground font-medium">{lastLog.weight} kg</span>
          {" · "}
          <span className="text-foreground font-medium">{lastLog.setsCompleted}/{lastLog.totalSets}</span> Sätze
        </div>
      )}
    </div>
  );
}

function WeightIncreaseDialog({ exercise, onConfirm, onDismiss }: {
  exercise: Exercise;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm bg-zinc-900 border-white/10 rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            Gewicht steigern?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Du hast alle Sätze bei <span className="text-foreground font-medium">{exercise.name}</span> abgeschlossen.
            Möchtest du das Gewicht um <span className="text-foreground font-medium">{exercise.increment} kg</span> auf <span className="text-foreground font-medium">{Math.round((exercise.weight + exercise.increment) * 100) / 100} kg</span> steigern?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-2 sm:flex-row">
          <Button variant="ghost" className="flex-1 h-11" onClick={onDismiss} data-testid="btn-skip-increment">
            Nein, beibehalten
          </Button>
          <Button className="flex-1 h-11" onClick={onConfirm} data-testid="btn-confirm-increment">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ja, steigern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExpandedExerciseCard({
  exercise,
  setsState,
  onToggleSet,
  onComplete,
  onChartOpen,
  onWeightChange,
}: {
  exercise: Exercise;
  setsState: boolean[];
  onToggleSet: (setIndex: number) => void;
  onComplete: () => void;
  onChartOpen: (ex: Exercise) => void;
  onWeightChange: (exerciseId: number, newWeight: number) => void;
}) {
  const { toast } = useToast();
  const [localWeight, setLocalWeight] = useState(exercise.weight);

  const incrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/increment`),
    onSuccess: async (res) => {
      const updated = await res.json();
      setLocalWeight(updated.weight);
      onWeightChange(exercise.id, updated.weight);
      toast({ title: "Gewicht gesteigert" });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/decrement`),
    onSuccess: async (res) => {
      const updated = await res.json();
      setLocalWeight(updated.weight);
      onWeightChange(exercise.id, updated.weight);
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
          disabled={isPending || localWeight <= 0}
          data-testid={`btn-decrement-active-${exercise.id}`}
        >
          <Minus className="w-4 h-4" />
          <span>{exercise.increment} kg</span>
        </button>

        <div className="flex-[1.4] h-12 flex flex-col items-center justify-center rounded-xl bg-white/8 border border-white/10">
          <span className="font-display font-bold text-xl leading-tight text-foreground">
            {localWeight}
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

function CollapsedExerciseCard({ exercise, completed, setsState, onGoBack }: {
  exercise: Exercise;
  completed: boolean;
  setsState: boolean[];
  onGoBack?: () => void;
}) {
  const setsCompleted = setsState.filter(Boolean).length;

  return (
    <div
      data-testid={`collapsed-exercise-${exercise.id}`}
      className={`rounded-2xl px-3 py-2.5 flex items-center gap-2.5 border ${
        completed
          ? "border-primary/20 bg-primary/5 opacity-70"
          : "border-white/8 bg-white/5 opacity-50"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {completed ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          )}
          <p className="font-semibold text-sm truncate">{exercise.name}</p>
        </div>
        {completed && (
          <div className="flex items-center gap-1 mt-1 ml-6">
            {setsState.map((done, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                  done
                    ? "bg-primary/15 text-primary"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </span>
            ))}
            <span className="text-xs text-muted-foreground ml-1.5">{setsCompleted}/{exercise.sets}</span>
          </div>
        )}
      </div>
      {completed && onGoBack && (
        <button
          onClick={onGoBack}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground active:text-primary active:bg-primary/10 shrink-0"
          data-testid={`btn-goback-${exercise.id}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
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
  const [setWeightsMap, setSetWeightsMap] = useState<Record<number, number[]>>({});
  const [weightIncreaseExercise, setWeightIncreaseExercise] = useState<Exercise | null>(null);

  const { toast } = useToast();

  const { data: allDays, isLoading: daysLoading } = useQuery<DayWithExercises[]>({
    queryKey: ["/api/all-training-days"],
  });

  const { data: trainingStatus, isLoading: statusLoading } = useQuery<TrainingStatus>({
    queryKey: ["/api/training-status"],
  });

  const logMutation = useMutation({
    mutationFn: (data: { exerciseId: number; weight: number; setsCompleted: number; totalSets: number; repsAchieved: boolean; setWeights: string }) =>
      apiRequest("POST", "/api/workout-logs", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", variables.exerciseId, "last-workout"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-status"] });
    },
  });

  const incrementMutationForPrompt = useMutation({
    mutationFn: (exerciseId: number) => apiRequest("POST", `/api/exercises/${exerciseId}/increment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      toast({ title: "Gewicht für nächstes Mal gesteigert!" });
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
    const currentExercise = selectedDay?.exercises.find(e => e.id === exerciseId);
    if (!currentExercise) return;

    setSetsMap((prev: Record<number, boolean[]>) => {
      const arr = [...(prev[exerciseId] || [])];
      arr[setIndex] = !arr[setIndex];
      return { ...prev, [exerciseId]: arr };
    });

    setSetWeightsMap(prev => {
      const weights = [...(prev[exerciseId] || new Array(currentExercise.sets).fill(currentExercise.weight))];
      weights[setIndex] = currentExercise.weight;
      return { ...prev, [exerciseId]: weights };
    });
  };

  const handleWeightChange = (exerciseId: number, newWeight: number) => {
    queryClient.setQueryData(["/api/all-training-days"], (old: any) => {
      if (!old) return old;
      return old.map((day: any) => ({
        ...day,
        exercises: day.exercises.map((ex: any) =>
          ex.id === exerciseId ? { ...ex, weight: newWeight } : ex
        ),
      }));
    });

    setSetWeightsMap(prev => {
      const currentWeights = prev[exerciseId];
      if (!currentWeights) return prev;
      const updated = currentWeights.map((w: number, i: number) => {
        const setDone = setsMap[exerciseId]?.[i];
        return setDone ? w : newWeight;
      });
      return { ...prev, [exerciseId]: updated };
    });
  };

  const completeExercise = (exercise: Exercise) => {
    const sets = setsMap[exercise.id] || [];
    const setsCompleted = sets.filter(Boolean).length;
    const allSetsCompleted = setsCompleted === exercise.sets;

    const weights = setWeightsMap[exercise.id] || new Array(exercise.sets).fill(exercise.weight);

    logMutation.mutate({
      exerciseId: exercise.id,
      weight: exercise.weight,
      setsCompleted,
      totalSets: exercise.sets,
      repsAchieved: false,
      setWeights: JSON.stringify(weights),
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

    if (allSetsCompleted && exercise.increment > 0) {
      setWeightIncreaseExercise(exercise);
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
    setSetWeightsMap(prev => {
      const { [exerciseId]: _, ...rest } = prev;
      return rest;
    });
    setActiveIndex(idx);
  };

  const startTraining = (dayId: number) => {
    const day = allDays?.find(d => d.id === dayId);
    if (day) {
      setSelectedDayId(dayId);
      initSetsForDay(day.exercises);
      setSetWeightsMap({});
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
                <AngularDumbbell className="w-6 h-6 text-primary" />
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
            <AngularDumbbell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
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
                  onWeightChange={handleWeightChange}
                />
              );
            }

            return (
              <CollapsedExerciseCard
                key={ex.id}
                exercise={ex}
                completed={isCompleted}
                setsState={setsMap[ex.id] || new Array(ex.sets).fill(false)}
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

      {weightIncreaseExercise && (
        <WeightIncreaseDialog
          exercise={weightIncreaseExercise}
          onConfirm={() => {
            incrementMutationForPrompt.mutate(weightIncreaseExercise.id);
            setWeightIncreaseExercise(null);
          }}
          onDismiss={() => setWeightIncreaseExercise(null)}
        />
      )}
    </div>
  );
}
