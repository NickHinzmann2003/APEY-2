import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  TrainingPlan, TrainingDay, Exercise, WeightHistory,
  InsertExercise
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2,
  Dumbbell, ChevronDown, ChevronRight, FolderOpen, Folder,
  BarChart2, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type ExerciseWithHistory = Exercise;
type DayWithExercises = TrainingDay & { exercises: ExerciseWithHistory[] };
type PlanWithDays = TrainingPlan & { trainingDays: DayWithExercises[] };

// ---------- Weight History Dialog ----------
function WeightHistoryDialog({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const { data: history, isLoading } = useQuery<WeightHistory[]>({
    queryKey: ["/api/exercises", exercise.id, "history"],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${exercise.id}/history`, { credentials: "include" });
      return res.json();
    },
  });

  const chartData = (history ?? []).map((h, i) => ({
    name: h.recordedAt
      ? format(new Date(h.recordedAt), "d. MMM", { locale: de })
      : `#${i + 1}`,
    Gewicht: h.weight,
  }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            {exercise.name} — Verlauf
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : chartData.length < 2 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Noch nicht genug Daten für einen Verlauf.</p>
            <p className="text-sm mt-1">Steigere das Gewicht mindestens zweimal, um einen Graphen zu sehen.</p>
          </div>
        ) : (
          <div className="pt-2">
            <div className="mb-4 flex gap-6 text-sm text-muted-foreground">
              <span>Aktuell: <strong className="text-foreground">{exercise.weight} kg</strong></span>
              <span>Steigerung: <strong className="text-primary">+{exercise.increment} kg</strong></span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#888", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `${v}kg`}
                />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(v: number) => [`${v} kg`, "Gewicht"]}
                />
                <Line
                  type="monotone"
                  dataKey="Gewicht"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- Exercise Row ----------
function ExerciseRow({ exercise, onChartOpen }: { exercise: Exercise; onChartOpen: (ex: Exercise) => void }) {
  const { toast } = useToast();

  const incrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/increment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Gewicht gesteigert!" });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/decrement`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Gewicht reduziert" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/exercises/${exercise.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
    },
  });

  return (
    <div
      data-testid={`exercise-row-${exercise.id}`}
      className="group flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/8 transition-all duration-200"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{exercise.name}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{exercise.sets}</span> Sätze ·{" "}
          <span className="font-medium text-foreground">{exercise.repsMin}–{exercise.repsMax}</span> Wdh ·{" "}
          <span className="font-medium text-foreground">{exercise.weight} kg</span>
          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
            ±{exercise.increment} kg
          </span>
        </p>
      </div>
      <div className="flex items-center gap-1 ml-3 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={() => onChartOpen(exercise)}
          data-testid={`btn-chart-${exercise.id}`}
          title="Verlauf anzeigen"
        >
          <BarChart2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
          onClick={() => decrementMutation.mutate()}
          disabled={decrementMutation.isPending || exercise.weight <= 0}
          data-testid={`btn-decrement-${exercise.id}`}
          title="Gewicht reduzieren"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2 text-green-400 border-green-500/20 hover:bg-green-500/10 hover:text-green-300"
          onClick={() => incrementMutation.mutate()}
          disabled={incrementMutation.isPending}
          data-testid={`btn-increment-${exercise.id}`}
          title="Gewicht steigern"
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => deleteMutation.mutate()}
          data-testid={`btn-delete-exercise-${exercise.id}`}
          title="Übung löschen"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ---------- Add Exercise Form ----------
function AddExerciseForm({ trainingDayId, exerciseCount, onDone }: {
  trainingDayId: number;
  exerciseCount: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<InsertExercise>>({
    name: "", sets: 3, repsMin: 8, repsMax: 12, weight: 20, increment: 2.5,
    order: exerciseCount, trainingDayId,
  });

  const addMutation = useMutation({
    mutationFn: (data: InsertExercise) => apiRequest("POST", "/api/exercises", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Übung hinzugefügt" });
      onDone();
    },
  });

  return (
    <div className="p-5 border border-primary/20 rounded-2xl bg-primary/5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Übungsname</Label>
          <Input
            placeholder="z.B. Bankdrücken"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-background border-white/10"
            data-testid="input-exercise-name"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Sätze</Label>
          <Input
            type="number" value={form.sets}
            onChange={(e) => setForm({ ...form, sets: parseInt(e.target.value) || 1 })}
            className="bg-background border-white/10"
            data-testid="input-exercise-sets"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Wiederholungen (Min – Max)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number" value={form.repsMin}
              onChange={(e) => setForm({ ...form, repsMin: parseInt(e.target.value) || 1 })}
              className="bg-background border-white/10"
              data-testid="input-exercise-reps-min"
              placeholder="6"
            />
            <span className="text-muted-foreground font-bold shrink-0">–</span>
            <Input
              type="number" value={form.repsMax}
              onChange={(e) => setForm({ ...form, repsMax: parseInt(e.target.value) || 1 })}
              className="bg-background border-white/10"
              data-testid="input-exercise-reps-max"
              placeholder="8"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Startgewicht (kg)</Label>
          <Input
            type="number" step="0.5" value={form.weight}
            onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
            className="bg-background border-white/10"
            data-testid="input-exercise-weight"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5 block">Steigerung (kg)</Label>
          <Input
            type="number" step="0.5" value={form.increment}
            onChange={(e) => setForm({ ...form, increment: parseFloat(e.target.value) || 0 })}
            className="bg-background border-white/10"
            data-testid="input-exercise-increment"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          className="flex-1 shadow-lg shadow-primary/20"
          onClick={() => addMutation.mutate(form as InsertExercise)}
          disabled={!form.name || addMutation.isPending}
          data-testid="btn-save-exercise"
        >
          {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Übung speichern
        </Button>
        <Button variant="ghost" onClick={onDone}>Abbrechen</Button>
      </div>
    </div>
  );
}

// ---------- Training Day (collapsible) ----------
function TrainingDayItem({
  day, onDelete, onChartOpen, initiallyOpen = false
}: {
  day: DayWithExercises;
  onDelete: () => void;
  onChartOpen: (ex: Exercise) => void;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div
      className="border border-white/5 rounded-2xl overflow-hidden bg-card/40 backdrop-blur-sm"
      data-testid={`training-day-${day.id}`}
    >
      {/* Day header */}
      <div
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors cursor-pointer select-none"
        onClick={() => setOpen(!open)}
        data-testid={`btn-toggle-day-${day.id}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-semibold text-base">{day.name}</span>
          <span className="text-xs text-muted-foreground">
            {day.exercises.length} {day.exercises.length === 1 ? "Übung" : "Übungen"}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          data-testid={`btn-delete-day-${day.id}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Day content */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {day.exercises.map((ex) => (
            <ExerciseRow key={ex.id} exercise={ex} onChartOpen={onChartOpen} />
          ))}

          {isAdding ? (
            <AddExerciseForm
              trainingDayId={day.id}
              exerciseCount={day.exercises.length}
              onDone={() => setIsAdding(false)}
            />
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all rounded-2xl"
              onClick={() => setIsAdding(true)}
              data-testid={`btn-add-exercise-${day.id}`}
            >
              <Plus className="w-4 h-4 mr-2" /> Übung hinzufügen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Training Plan (collapsible folder) ----------
function TrainingPlanSection({
  plan, onDelete, onChartOpen
}: {
  plan: PlanWithDays;
  onDelete: () => void;
  onChartOpen: (ex: Exercise) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [newDayName, setNewDayName] = useState("");

  const createDayMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest("POST", "/api/training-days", { name, planId: plan.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      setNewDayName("");
      setIsAddingDay(false);
      toast({ title: "Trainingstag erstellt" });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-days/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      toast({ title: "Trainingstag gelöscht" });
    },
  });

  const totalExercises = plan.trainingDays.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <div
      className="border border-white/8 rounded-3xl overflow-hidden bg-card/30 backdrop-blur-sm shadow-xl"
      data-testid={`training-plan-${plan.id}`}
    >
      {/* Plan header */}
      <div
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer select-none"
        onClick={() => setOpen(!open)}
        data-testid={`btn-toggle-plan-${plan.id}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          {open ? (
            <FolderOpen className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <Folder className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <span className="font-display font-bold text-xl">{plan.name}</span>
          <span className="text-xs text-muted-foreground ml-1">
            {plan.trainingDays.length} {plan.trainingDays.length === 1 ? "Tag" : "Tage"} · {totalExercises} Übungen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            data-testid={`btn-delete-plan-${plan.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Plan content */}
      {open && (
        <div className="px-6 pb-6 space-y-3 border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {plan.trainingDays.length === 0 && !isAddingDay && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Trainingstage in diesem Plan.
            </p>
          )}

          {plan.trainingDays.map((day) => (
            <TrainingDayItem
              key={day.id}
              day={day}
              onDelete={() => deleteDayMutation.mutate(day.id)}
              onChartOpen={onChartOpen}
            />
          ))}

          {isAddingDay ? (
            <div className="flex gap-3 p-4 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in duration-200">
              <Input
                placeholder="z.B. Upper, Lower, Push..."
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="bg-background border-white/10"
                data-testid="input-day-name-in-plan"
                onKeyDown={(e) => e.key === "Enter" && newDayName && createDayMutation.mutate(newDayName)}
                autoFocus
              />
              <Button
                onClick={() => createDayMutation.mutate(newDayName)}
                disabled={!newDayName || createDayMutation.isPending}
                data-testid="btn-confirm-add-day-in-plan"
              >
                {createDayMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingDay(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-12 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all rounded-2xl"
              onClick={() => setIsAddingDay(true)}
              data-testid={`btn-add-day-to-plan-${plan.id}`}
            >
              <Plus className="w-4 h-4 mr-2" /> Trainingstag hinzufügen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main Dashboard ----------
export function Dashboard() {
  const { toast } = useToast();
  const [chartExercise, setChartExercise] = useState<Exercise | null>(null);

  // Plans state
  const [newPlanName, setNewPlanName] = useState("");
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  // Standalone days state
  const [newDayName, setNewDayName] = useState("");
  const [isAddingDay, setIsAddingDay] = useState(false);

  const { data: plans, isLoading: plansLoading } = useQuery<PlanWithDays[]>({
    queryKey: ["/api/training-plans"],
  });

  const { data: standaloneDays, isLoading: daysLoading } = useQuery<DayWithExercises[]>({
    queryKey: ["/api/training-days"],
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
      toast({ title: "Trainingsplan gelöscht" });
    },
  });

  const createDayMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/training-days", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      setNewDayName("");
      setIsAddingDay(false);
      toast({ title: "Trainingstag erstellt" });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-days/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Trainingstag gelöscht" });
    },
  });

  const isLoading = plansLoading || daysLoading;
  const isEmpty = (plans?.length ?? 0) === 0 && (standaloneDays?.length ?? 0) === 0;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Mein Training</h1>
        <p className="text-muted-foreground">Verwalte deine Trainingspläne, Tage und Übungen.</p>
      </div>

      {isEmpty ? (
        <div className="text-center py-28 border border-dashed border-white/10 rounded-3xl">
          <Dumbbell className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-display font-semibold mb-2">Noch kein Training erfasst</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8">
            Erstelle einen Trainingsplan (z.B. Upper/Lower) oder füge direkt einzelne Trainingstage hinzu.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => setIsAddingPlan(true)} data-testid="btn-create-first-plan">
              <Folder className="w-4 h-4 mr-2" /> Trainingsplan erstellen
            </Button>
            <Button variant="outline" onClick={() => setIsAddingDay(true)} data-testid="btn-create-first-day">
              <Plus className="w-4 h-4 mr-2" /> Trainingstag erstellen
            </Button>
          </div>
        </div>
      ) : null}

      {/* Training Plans */}
      {(!isEmpty || plans?.length || isAddingPlan) && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              Trainingspläne
            </h2>
            {!isAddingPlan && (
              <Button
                size="sm" variant="outline"
                className="border-white/10 hover:border-primary/50 hover:text-primary"
                onClick={() => setIsAddingPlan(true)}
                data-testid="btn-create-plan"
              >
                <Plus className="w-4 h-4 mr-1" /> Neuer Plan
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {isAddingPlan && (
              <div className="flex gap-3 p-5 border border-primary/20 rounded-3xl bg-primary/5 animate-in fade-in duration-200">
                <Input
                  placeholder="z.B. Upper / Lower, Push Pull Legs..."
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  className="bg-background border-white/10"
                  data-testid="input-plan-name"
                  onKeyDown={(e) => e.key === "Enter" && newPlanName && createPlanMutation.mutate(newPlanName)}
                  autoFocus
                />
                <Button
                  onClick={() => createPlanMutation.mutate(newPlanName)}
                  disabled={!newPlanName || createPlanMutation.isPending}
                  data-testid="btn-confirm-create-plan"
                >
                  {createPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsAddingPlan(false)}>
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
              />
            ))}
          </div>
        </section>
      )}

      {/* Standalone Training Days */}
      {(!isEmpty || standaloneDays?.length || isAddingDay) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" />
              Einzelne Trainingstage
            </h2>
            {!isAddingDay && (
              <Button
                size="sm" variant="outline"
                className="border-white/10 hover:border-primary/50 hover:text-primary"
                onClick={() => setIsAddingDay(true)}
                data-testid="btn-create-standalone-day"
              >
                <Plus className="w-4 h-4 mr-1" /> Neuer Tag
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {isAddingDay && (
              <div className="flex gap-3 p-4 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in duration-200">
                <Input
                  placeholder="z.B. Beine, Rücken, Brust..."
                  value={newDayName}
                  onChange={(e) => setNewDayName(e.target.value)}
                  className="bg-background border-white/10"
                  data-testid="input-standalone-day-name"
                  onKeyDown={(e) => e.key === "Enter" && newDayName && createDayMutation.mutate(newDayName)}
                  autoFocus
                />
                <Button
                  onClick={() => createDayMutation.mutate(newDayName)}
                  disabled={!newDayName || createDayMutation.isPending}
                  data-testid="btn-confirm-create-day"
                >
                  {createDayMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsAddingDay(false)}>
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

            {(standaloneDays?.length ?? 0) === 0 && !isAddingDay && !isEmpty && (
              <div className="text-center py-8 border border-dashed border-white/8 rounded-2xl text-muted-foreground text-sm">
                Keine einzelnen Trainingstage vorhanden.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Weight History Dialog */}
      {chartExercise && (
        <WeightHistoryDialog
          exercise={chartExercise}
          onClose={() => setChartExercise(null)}
        />
      )}
    </Shell>
  );
}
