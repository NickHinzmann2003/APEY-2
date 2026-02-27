import { createContext, useContext, useState, type ReactNode } from "react";

type TrainingState = {
  selectedDayId: number | null;
  activeIndex: number;
  setsMap: Record<number, boolean[]>;
  completedSet: Set<number>;
};

type TrainingContextType = {
  state: TrainingState;
  setSelectedDayId: (id: number | null) => void;
  setActiveIndex: (idx: number) => void;
  setSetsMap: (fn: Record<number, boolean[]> | ((prev: Record<number, boolean[]>) => Record<number, boolean[]>)) => void;
  setCompletedSet: (fn: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  initSetsForDay: (exercises: { id: number; sets: number }[]) => void;
  endTraining: () => void;
  isTrainingActive: boolean;
};

const TrainingContext = createContext<TrainingContextType | null>(null);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [setsMap, setSetsMapRaw] = useState<Record<number, boolean[]>>({});
  const [completedSet, setCompletedSetRaw] = useState<Set<number>>(new Set());

  const setSetsMap = (fn: Record<number, boolean[]> | ((prev: Record<number, boolean[]>) => Record<number, boolean[]>)) => {
    if (typeof fn === "function") setSetsMapRaw(fn);
    else setSetsMapRaw(fn);
  };

  const setCompletedSet = (fn: Set<number> | ((prev: Set<number>) => Set<number>)) => {
    if (typeof fn === "function") setCompletedSetRaw(fn);
    else setCompletedSetRaw(fn);
  };

  const initSetsForDay = (exercises: { id: number; sets: number }[]) => {
    const newSetsMap: Record<number, boolean[]> = {};
    exercises.forEach(ex => {
      newSetsMap[ex.id] = new Array(ex.sets).fill(false);
    });
    setSetsMapRaw(newSetsMap);
    setCompletedSetRaw(new Set());
    setActiveIndex(0);
  };

  const endTraining = () => {
    setSelectedDayId(null);
    setSetsMapRaw({});
    setCompletedSetRaw(new Set());
    setActiveIndex(0);
  };

  return (
    <TrainingContext.Provider value={{
      state: { selectedDayId, activeIndex, setsMap, completedSet },
      setSelectedDayId,
      setActiveIndex,
      setSetsMap,
      setCompletedSet,
      initSetsForDay,
      endTraining,
      isTrainingActive: selectedDayId !== null,
    }}>
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error("useTraining must be used within TrainingProvider");
  return ctx;
}
