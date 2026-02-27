import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart2 } from "lucide-react";

type AnalyticsItem = {
  exerciseId: number;
  exerciseName: string;
  dayName: string;
  templateId: number | null;
  currentWeight: number;
  oldWeight: number;
  percentChange: number;
};

export function Analytics() {
  const { data, isLoading } = useQuery<AnalyticsItem[]>({
    queryKey: ["/api/analytics"],
  });

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
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Auswertungen</h1>
        <p className="text-muted-foreground text-sm">Gewichtsveränderung der letzten 30 Tage</p>
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
          <div className="border border-white/10 rounded-2xl bg-white/5 p-4 mb-6">
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
              <div
                key={item.exerciseId}
                data-testid={`analytics-exercise-${item.exerciseId}`}
                className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/8 bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base truncate">{item.exerciseName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.oldWeight} kg → {item.currentWeight} kg
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold shrink-0 ml-3 ${
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
