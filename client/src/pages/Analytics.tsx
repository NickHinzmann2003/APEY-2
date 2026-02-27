import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart2, ArrowLeft, Dumbbell, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type AnalyticsItem = {
  exerciseId: number;
  exerciseName: string;
  dayName: string;
  templateId: number | null;
  currentWeight: number;
  oldWeight: number;
  percentChange: number;
};

type ExerciseDetailAnalytics = {
  templateId: number;
  exerciseName: string;
  category: string | null;
  totalWorkouts: number;
  currentWeight: number;
  oldWeight: number;
  percentChange: number;
  weightHistory: { date: string; weight: number }[];
};

const PERIODS = [
  { value: undefined, label: "30 Tage" },
  { value: "this_month", label: "Dieser Monat" },
  { value: "last_month", label: "Letzter Monat" },
  { value: "this_year", label: "Dieses Jahr" },
  { value: "last_year", label: "Letztes Jahr" },
  { value: "all", label: "Gesamt" },
] as const;

function PeriodSelector({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {PERIODS.map(p => (
        <button
          key={p.label}
          onClick={() => onChange(p.value)}
          data-testid={`btn-period-${p.value || "default"}`}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            value === p.value
              ? "bg-primary text-primary-foreground"
              : "bg-white/8 text-muted-foreground active:bg-white/15"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function ExerciseDetail({ templateId, onBack }: { templateId: number; onBack: () => void }) {
  const [period, setPeriod] = useState<string | undefined>(undefined);

  const queryKey = period
    ? ["/api/analytics/exercise", templateId, period]
    : ["/api/analytics/exercise", templateId];

  const { data, isLoading } = useQuery<ExerciseDetailAnalytics | null>({
    queryKey,
    queryFn: async () => {
      const url = period
        ? `/api/analytics/exercise/${templateId}?period=${period}`
        : `/api/analytics/exercise/${templateId}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json || !json.weightHistory) return null;
      return json;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Keine Daten verfügbar</p>
        <Button variant="ghost" className="mt-4" onClick={onBack}>Zurück</Button>
      </div>
    );
  }

  const chartData = data.weightHistory.map(h => ({
    Datum: format(new Date(h.date), "dd.MM", { locale: de }),
    Gewicht: h.weight,
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground active:bg-white/10"
          data-testid="btn-back-to-analytics"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold truncate">{data.exerciseName}</h1>
          {data.category && (
            <p className="text-xs text-muted-foreground">{data.category}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="border border-white/10 rounded-2xl bg-white/5 p-3.5">
          <p className="text-xs text-muted-foreground mb-1">Trainings</p>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="font-display text-2xl font-bold" data-testid="text-total-workouts">{data.totalWorkouts}</span>
          </div>
        </div>
        <div className="border border-white/10 rounded-2xl bg-white/5 p-3.5">
          <p className="text-xs text-muted-foreground mb-1">Veränderung</p>
          <div className="flex items-center gap-2">
            {data.percentChange > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : data.percentChange < 0 ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <Minus className="w-5 h-5 text-muted-foreground" />
            )}
            <span data-testid="text-detail-change" className={`font-display text-2xl font-bold ${
              data.percentChange > 0 ? "text-green-400" : data.percentChange < 0 ? "text-red-400" : "text-foreground"
            }`}>
              {data.percentChange > 0 ? "+" : ""}{data.percentChange}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="border border-white/10 rounded-2xl bg-white/5 p-3.5">
          <p className="text-xs text-muted-foreground mb-1">Start</p>
          <span className="font-display text-xl font-bold" data-testid="text-old-weight">{data.oldWeight} kg</span>
        </div>
        <div className="border border-white/10 rounded-2xl bg-white/5 p-3.5">
          <p className="text-xs text-muted-foreground mb-1">Aktuell</p>
          <span className="font-display text-xl font-bold text-primary" data-testid="text-current-weight">{data.currentWeight} kg</span>
        </div>
      </div>

      {chartData.length > 1 ? (
        <div className="border border-white/10 rounded-2xl bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">Gewichtsverlauf</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="Datum" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}kg`}
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
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
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl">
          <BarChart2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Noch nicht genug Daten für ein Diagramm</p>
        </div>
      )}
    </div>
  );
}

export function Analytics() {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const queryKey = period
    ? ["/api/analytics", period]
    : ["/api/analytics"];

  const { data, isLoading } = useQuery<AnalyticsItem[]>({
    queryKey,
    queryFn: async () => {
      const url = period ? `/api/analytics?period=${period}` : "/api/analytics";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  if (selectedTemplateId !== null) {
    return (
      <ExerciseDetail
        templateId={selectedTemplateId}
        onBack={() => setSelectedTemplateId(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAvgChange = data && data.length > 0
    ? Math.round((data.reduce((sum, d) => sum + d.percentChange, 0) / data.length) * 10) / 10
    : 0;

  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold mb-1">Auswertungen</h1>
        <p className="text-muted-foreground text-sm">Deine Trainingsfortschritte</p>
      </div>

      <div className="mb-5">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {(!data || data.length === 0) ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <BarChart2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-display font-semibold mb-2">Noch keine Daten</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Sobald du Übungen erstellst und Gewichte steigerst, siehst du hier deine Fortschritte.
          </p>
        </div>
      ) : (
        <>
          <div className="border border-white/10 rounded-2xl bg-white/5 p-4 mb-5">
            <p className="text-sm text-muted-foreground mb-1">Durchschnittliche Steigerung</p>
            <div className="flex items-center gap-2">
              {totalAvgChange > 0 ? (
                <TrendingUp className="w-6 h-6 text-green-400" />
              ) : totalAvgChange < 0 ? (
                <TrendingDown className="w-6 h-6 text-red-400" />
              ) : (
                <Minus className="w-6 h-6 text-muted-foreground" />
              )}
              <span data-testid="text-avg-change" className={`font-display text-3xl font-bold ${
                totalAvgChange > 0 ? "text-green-400" : totalAvgChange < 0 ? "text-red-400" : "text-foreground"
              }`}>
                {totalAvgChange > 0 ? "+" : ""}{totalAvgChange}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {data.map(item => (
              <button
                key={item.exerciseId}
                data-testid={`analytics-exercise-${item.exerciseId}`}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-white/8 bg-white/5 active:bg-white/10 transition-colors text-left"
                onClick={() => item.templateId ? setSelectedTemplateId(item.templateId) : undefined}
                disabled={!item.templateId}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base truncate">{item.exerciseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.oldWeight} kg → {item.currentWeight} kg
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className={`flex items-center gap-1 text-sm font-bold ${
                    item.percentChange > 0 ? "text-green-400" : item.percentChange < 0 ? "text-red-400" : "text-muted-foreground"
                  }`}>
                    {item.percentChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : item.percentChange < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    <span>{item.percentChange > 0 ? "+" : ""}{item.percentChange}%</span>
                  </div>
                  {item.templateId && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
