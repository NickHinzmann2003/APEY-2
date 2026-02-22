import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TrainingDay, Exercise, InsertTrainingDay, InsertExercise } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUpCircle, Loader2, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Shell } from "@/components/layout/Shell";

export function Dashboard() {
  const { toast } = useToast();
  const [newDayName, setNewDayName] = useState("");

  const { data: trainingDays, isLoading } = useQuery<(TrainingDay & { exercises: Exercise[] })[]>({
    queryKey: ["/api/training-days"],
  });

  const createDayMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/training-days", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      setNewDayName("");
      toast({ title: "Trainingstag erstellt" });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/training-days/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Trainingstag gelöscht" });
    },
  });

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
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold mb-2">Mein Trainingsplan</h1>
        <p className="text-muted-foreground">Erstelle deine Trainingstage und verwalte deine Übungen.</p>
      </div>

      <Card className="mb-8 glass-panel border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">Neuen Trainingstag erstellen</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="z.B. Push, Pull, Beine"
            value={newDayName}
            onChange={(e) => setNewDayName(e.target.value)}
            className="bg-white/5 border-white/10"
          />
          <Button 
            onClick={() => createDayMutation.mutate(newDayName)}
            disabled={!newDayName || createDayMutation.isPending}
            className="shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Hinzufügen
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-8">
        {trainingDays?.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-3xl border-dashed">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold mb-2">Noch kein Trainingsplan</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Erstelle oben deinen ersten Trainingstag, um zu starten.</p>
          </div>
        ) : (
          trainingDays?.map((day) => (
            <TrainingDayCard key={day.id} day={day} onDelete={() => deleteDayMutation.mutate(day.id)} />
          ))
        )}
      </div>
    </Shell>
  );
}

function TrainingDayCard({ day, onDelete }: { day: TrainingDay & { exercises: Exercise[] }, onDelete: () => void }) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newExercise, setNewExercise] = useState<Partial<InsertExercise>>({
    name: "",
    sets: 3,
    weight: 20,
    increment: 2.5,
    order: day.exercises.length,
    trainingDayId: day.id
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (data: InsertExercise) => {
      await apiRequest("POST", "/api/exercises", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      setIsAdding(false);
      setNewExercise({
        name: "",
        sets: 3,
        weight: 20,
        increment: 2.5,
        order: day.exercises.length + 1,
        trainingDayId: day.id
      });
      toast({ title: "Übung hinzugefügt" });
    },
  });

  const incrementMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/exercises/${id}/increment`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
      toast({ title: "Gewicht gesteigert!" });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-days"] });
    },
  });

  return (
    <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
        <CardTitle className="text-2xl font-display">{day.name}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {day.exercises.map((ex) => (
            <div key={ex.id} className="group flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300">
              <div>
                <p className="text-lg font-semibold">{ex.name}</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{ex.sets}</span> Sätze à <span className="font-medium text-foreground">{ex.weight}kg</span> 
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">+{ex.increment}kg</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white transition-all duration-300"
                  onClick={() => incrementMutation.mutate(ex.id)}
                  disabled={incrementMutation.isPending}
                >
                  <ArrowUpCircle className="w-4 h-4 mr-2" /> Steigern
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteExerciseMutation.mutate(ex.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {isAdding ? (
            <div className="p-6 border border-primary/20 rounded-2xl bg-primary/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Name der Übung</Label>
                  <Input 
                    placeholder="z.B. Bankdrücken"
                    value={newExercise.name} 
                    onChange={e => setNewExercise({...newExercise, name: e.target.value})}
                    className="bg-background border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Sätze</Label>
                  <Input 
                    type="number" 
                    value={newExercise.sets} 
                    onChange={e => setNewExercise({...newExercise, sets: parseInt(e.target.value)})}
                    className="bg-background border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Startgewicht (kg)</Label>
                  <Input 
                    type="number" 
                    step="0.5"
                    value={newExercise.weight} 
                    onChange={e => setNewExercise({...newExercise, weight: parseFloat(e.target.value)})}
                    className="bg-background border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 block">Steigerung (kg)</Label>
                  <Input 
                    type="number" 
                    step="0.5"
                    value={newExercise.increment} 
                    onChange={e => setNewExercise({...newExercise, increment: parseFloat(e.target.value)})}
                    className="bg-background border-white/10"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 shadow-lg shadow-primary/20" onClick={() => addExerciseMutation.mutate(newExercise as InsertExercise)} disabled={!newExercise.name || addExerciseMutation.isPending}>
                  Übung Speichern
                </Button>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>Abbrechen</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full h-14 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all duration-300 rounded-2xl" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" /> Übung hinzufügen
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
