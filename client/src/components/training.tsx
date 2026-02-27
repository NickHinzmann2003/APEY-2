import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  TrainingPlan, TrainingDay, Exercise, WeightHistory,
  ExerciseTemplate, InsertExercise
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Plus, Trash2, Loader2,
  ChevronDown, ChevronRight, FolderOpen, Folder,
  BarChart2, X, Minus, Pencil, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export type DayWithExercises = TrainingDay & { exercises: Exercise[] };
export type PlanWithDays = TrainingPlan & { trainingDays: DayWithExercises[] };

export function WeightHistoryDialog({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg bg-zinc-900 border-white/10 rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary shrink-0" />
            {exercise.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Gewichtsverlauf
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 text-sm pt-1">
          <div className="bg-white/5 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-muted-foreground text-xs mb-0.5">Aktuell</p>
            <p className="font-bold text-lg text-foreground">{exercise.weight} kg</p>
          </div>
          <div className="bg-primary/10 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-muted-foreground text-xs mb-0.5">Steigerung</p>
            <p className="font-bold text-lg text-primary">+{exercise.increment} kg</p>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-muted-foreground text-xs mb-0.5">Wdh</p>
            <p className="font-bold text-lg text-foreground">{exercise.repsMin}–{exercise.repsMax}</p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : chartData.length < 2 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <p>Noch nicht genug Daten.</p>
            <p className="mt-1">Steigere das Gewicht mindestens zweimal, um einen Graphen zu sehen.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#888", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}kg`}
                width={45}
              />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13 }}
                labelStyle={{ color: "#a1a1aa" }}
                formatter={(v: number) => [`${v} kg`, "Gewicht"]}
              />
              <Line
                type="monotone"
                dataKey="Gewicht"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ExerciseRow({ exercise, onChartOpen }: { exercise: Exercise; onChartOpen: (ex: Exercise) => void }) {
  const { toast } = useToast();

  const incrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/increment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      toast({ title: "✓ Gewicht gesteigert" });
    },
  });

  const decrementMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/exercises/${exercise.id}/decrement`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      toast({ title: "Gewicht reduziert" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/exercises/${exercise.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
    },
  });

  const isPending = incrementMutation.isPending || decrementMutation.isPending;

  return (
    <div
      data-testid={`exercise-row-${exercise.id}`}
      className="border border-white/8 rounded-2xl bg-white/5 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-base leading-tight truncate">{exercise.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="text-foreground font-medium">{exercise.sets}</span> Sätze ·{" "}
            <span className="text-foreground font-medium">{exercise.repsMin}–{exercise.repsMax}</span> Wdh
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              ±{exercise.increment} kg
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground active:bg-primary/10 active:text-primary"
            onClick={() => onChartOpen(exercise)}
            data-testid={`btn-chart-${exercise.id}`}
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground active:bg-destructive/10 active:text-destructive"
            onClick={() => deleteMutation.mutate()}
            data-testid={`btn-delete-exercise-${exercise.id}`}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pb-3">
        <button
          className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 text-red-400 active:bg-red-500/25 disabled:opacity-40 transition-colors font-semibold text-sm"
          onClick={() => decrementMutation.mutate()}
          disabled={isPending || exercise.weight <= 0}
          data-testid={`btn-decrement-${exercise.id}`}
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
          data-testid={`btn-increment-${exercise.id}`}
        >
          <Plus className="w-4 h-4" />
          <span>{exercise.increment} kg</span>
        </button>
      </div>
    </div>
  );
}

export function AddExerciseForm({ trainingDayId, exerciseCount, onDone }: {
  trainingDayId: number;
  exerciseCount: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [sets, setSets] = useState("3");
  const [repsMin, setRepsMin] = useState("8");
  const [repsMax, setRepsMax] = useState("12");
  const [weight, setWeight] = useState("20");
  const [increment, setIncrement] = useState("2.5");

  const { data: templates } = useQuery<ExerciseTemplate[]>({
    queryKey: ["/api/exercise-templates"],
  });

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  const addMutation = useMutation({
    mutationFn: (data: InsertExercise) => apiRequest("POST", "/api/exercises", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      toast({ title: "Übung hinzugefügt" });
      onDone();
    },
  });

  const handleSave = () => {
    if (!selectedTemplate) return;
    const parsed: InsertExercise = {
      name: selectedTemplate.name,
      exerciseTemplateId: selectedTemplate.id,
      sets: parseInt(sets) || 1,
      repsMin: parseInt(repsMin) || 1,
      repsMax: parseInt(repsMax) || 1,
      weight: parseFloat(weight) || 0,
      increment: parseFloat(increment) || 0,
      order: exerciseCount,
      trainingDayId,
    };
    addMutation.mutate(parsed);
  };

  if (!selectedTemplateId) {
    return (
      <div className="p-4 border border-primary/20 rounded-2xl bg-primary/5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
        <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Übung wählen</Label>
        {(!templates || templates.length === 0) ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <p>Noch keine Übungen angelegt.</p>
            <p className="mt-1">Erstelle zuerst Übungen im Tab "Übungen".</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                data-testid={`btn-pick-template-${t.id}`}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-background border border-white/10 active:bg-white/10 text-left transition-colors"
              >
                <Plus className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-base truncate">{t.name}</span>
              </button>
            ))}
          </div>
        )}
        <Button variant="ghost" className="w-full h-10 mt-2" onClick={onDone} data-testid="btn-cancel-pick-template">Abbrechen</Button>
      </div>
    );
  }

  return (
    <div className="p-4 border border-primary/20 rounded-2xl bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div>
        <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Übung</Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-12 bg-background border border-white/10 rounded-md px-3 flex items-center text-base font-medium">
            {selectedTemplate?.name}
          </div>
          <button
            className="h-12 px-3 text-sm text-primary font-medium"
            onClick={() => setSelectedTemplateId(null)}
            data-testid="btn-change-template"
          >
            Ändern
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Sätze</Label>
          <Input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="bg-background border-white/10 h-12 text-base"
            data-testid="input-exercise-sets"
          />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Steigerung (kg)</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={increment}
            onChange={(e) => setIncrement(e.target.value)}
            className="bg-background border-white/10 h-12 text-base"
            data-testid="input-exercise-increment"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">
          Wiederholungen (Min – Max)
        </Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            inputMode="numeric"
            value={repsMin}
            onChange={(e) => setRepsMin(e.target.value)}
            className="bg-background border-white/10 h-12 text-base text-center"
            data-testid="input-exercise-reps-min"
            placeholder="6"
          />
          <span className="text-muted-foreground font-bold text-lg shrink-0">–</span>
          <Input
            type="number"
            inputMode="numeric"
            value={repsMax}
            onChange={(e) => setRepsMax(e.target.value)}
            className="bg-background border-white/10 h-12 text-base text-center"
            data-testid="input-exercise-reps-max"
            placeholder="8"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Startgewicht (kg)</Label>
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="bg-background border-white/10 h-12 text-base"
          data-testid="input-exercise-weight"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          className="flex-1 h-12 shadow-lg shadow-primary/20 text-base"
          onClick={handleSave}
          disabled={addMutation.isPending}
          data-testid="btn-save-exercise"
        >
          {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Speichern
        </Button>
        <Button variant="ghost" className="h-12 px-5" onClick={onDone} data-testid="btn-cancel-add-exercise">Abbrechen</Button>
      </div>
    </div>
  );
}

export function TrainingDayItem({
  day, onDelete, onChartOpen,
}: {
  day: DayWithExercises;
  onDelete: () => void;
  onChartOpen: (ex: Exercise) => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(day.name);

  const renameMutation = useMutation({
    mutationFn: (name: string) => apiRequest("PATCH", `/api/training-days/${day.id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      setIsRenaming(false);
      toast({ title: "Trainingstag umbenannt" });
    },
  });

  const handleRenameConfirm = () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === day.name) { setIsRenaming(false); return; }
    renameMutation.mutate(trimmed);
  };

  return (
    <div
      className="border border-white/8 rounded-2xl overflow-hidden bg-zinc-900/60"
      data-testid={`training-day-${day.id}`}
    >
      {isRenaming ? (
        <div className="flex items-center gap-2 px-3 py-2.5" style={{ minHeight: 56 }}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 h-10 text-base bg-background border-white/20"
            data-testid={`input-rename-day-${day.id}`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameConfirm();
              if (e.key === "Escape") { setIsRenaming(false); setNewName(day.name); }
            }}
          />
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/15 text-primary active:bg-primary/30 shrink-0"
            onClick={handleRenameConfirm}
            disabled={renameMutation.isPending}
            data-testid={`btn-rename-confirm-${day.id}`}
          >
            {renameMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Check className="w-4 h-4" />}
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground active:bg-white/10 shrink-0"
            onClick={() => { setIsRenaming(false); setNewName(day.name); }}
            data-testid={`btn-rename-cancel-${day.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-4 cursor-pointer select-none active:bg-white/5 transition-colors"
          style={{ minHeight: 56 }}
          onClick={() => setOpen(!open)}
          data-testid={`btn-toggle-day-${day.id}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {open
              ? <ChevronDown className="w-5 h-5 text-primary shrink-0" />
              : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            }
            <span className="font-semibold text-base truncate">{day.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {day.exercises.length} {day.exercises.length === 1 ? "Übung" : "Übungen"}
            </span>
          </div>
          <div className="flex items-center shrink-0">
            <button
              className="w-10 h-11 flex items-center justify-center rounded-xl text-muted-foreground active:text-primary"
              onClick={(e) => { e.stopPropagation(); setNewName(day.name); setIsRenaming(true); }}
              data-testid={`btn-rename-day-${day.id}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              className="w-10 h-11 flex items-center justify-center rounded-xl text-muted-foreground active:text-destructive shrink-0"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              data-testid={`btn-delete-day-${day.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
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
            <button
              className="w-full h-12 border border-dashed border-white/10 rounded-2xl text-muted-foreground active:text-primary active:border-primary/50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              onClick={() => setIsAdding(true)}
              data-testid={`btn-add-exercise-${day.id}`}
            >
              <Plus className="w-4 h-4" /> Übung hinzufügen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TrainingPlanSection({
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
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      setNewDayName("");
      setIsAddingDay(false);
      toast({ title: "Trainingstag erstellt" });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-days/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/all-training-days"] });
      toast({ title: "Trainingstag gelöscht" });
    },
  });

  const totalExercises = plan.trainingDays.reduce((sum, d) => sum + d.exercises.length, 0);

  return (
    <div
      className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/40 shadow-lg"
      data-testid={`training-plan-${plan.id}`}
    >
      <div
        className="flex items-center justify-between px-4 cursor-pointer select-none active:bg-white/5 transition-colors"
        style={{ minHeight: 64 }}
        onClick={() => setOpen(!open)}
        data-testid={`btn-toggle-plan-${plan.id}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {open
            ? <FolderOpen className="w-6 h-6 text-primary shrink-0" />
            : <Folder className="w-6 h-6 text-muted-foreground shrink-0" />
          }
          <div className="min-w-0">
            <p className="font-display font-bold text-lg leading-tight truncate">{plan.name}</p>
            <p className="text-xs text-muted-foreground">
              {plan.trainingDays.length} {plan.trainingDays.length === 1 ? "Tag" : "Tage"} · {totalExercises} Übungen
            </p>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
          <button
            className="w-11 h-11 flex items-center justify-center rounded-xl text-muted-foreground active:text-destructive ml-1"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            data-testid={`btn-delete-plan-${plan.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
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
            <div className="flex gap-2 p-3 border border-primary/20 rounded-2xl bg-primary/5 animate-in fade-in duration-200">
              <Input
                placeholder="z.B. Upper, Lower, Push..."
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="bg-background border-white/10 h-12 text-base flex-1"
                data-testid="input-day-name-in-plan"
                onKeyDown={(e) => e.key === "Enter" && newDayName && createDayMutation.mutate(newDayName)}
                autoFocus
              />
              <Button
                className="h-12 px-4 shrink-0"
                onClick={() => createDayMutation.mutate(newDayName)}
                disabled={!newDayName || createDayMutation.isPending}
                data-testid="btn-confirm-add-day-in-plan"
              >
                {createDayMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={() => setIsAddingDay(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              className="w-full h-12 border border-dashed border-white/10 rounded-2xl text-muted-foreground active:text-primary active:border-primary/50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              onClick={() => setIsAddingDay(true)}
              data-testid={`btn-add-day-to-plan-${plan.id}`}
            >
              <Plus className="w-4 h-4" /> Trainingstag hinzufügen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
