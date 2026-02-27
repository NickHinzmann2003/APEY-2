import { db } from "./db";
import {
  trainingPlans, trainingDays, exercises, weightHistory,
  type TrainingPlan, type TrainingDay, type Exercise, type WeightHistory,
  type InsertTrainingPlan, type InsertTrainingDay, type InsertExercise
} from "@shared/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";

export type TrainingDayWithExercises = TrainingDay & { exercises: Exercise[] };
export type TrainingPlanWithDays = TrainingPlan & { trainingDays: TrainingDayWithExercises[] };

export interface IStorage {
  // Training Plans
  getTrainingPlans(userId: string): Promise<TrainingPlanWithDays[]>;
  createTrainingPlan(userId: string, data: InsertTrainingPlan): Promise<TrainingPlan>;
  deleteTrainingPlan(id: number, userId: string): Promise<void>;

  // Training Days (standalone, no plan)
  getTrainingDays(userId: string): Promise<TrainingDayWithExercises[]>;
  createTrainingDay(userId: string, data: InsertTrainingDay): Promise<TrainingDay>;
  renameTrainingDay(id: number, userId: string, name: string): Promise<TrainingDay | undefined>;
  deleteTrainingDay(id: number, userId: string): Promise<void>;

  // Exercises
  createExercise(data: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise | undefined>;
  incrementExerciseWeight(id: number): Promise<Exercise | undefined>;
  decrementExerciseWeight(id: number): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
  getWeightHistory(exerciseId: number): Promise<WeightHistory[]>;
  getAllTrainingDaysForUser(userId: string): Promise<TrainingDayWithExercises[]>;
  getAnalyticsData(userId: string): Promise<AnalyticsItem[]>;
}

export type AnalyticsItem = {
  exerciseId: number;
  exerciseName: string;
  dayName: string;
  currentWeight: number;
  oldWeight: number;
  percentChange: number;
};

export class DatabaseStorage implements IStorage {
  async getTrainingPlans(userId: string): Promise<TrainingPlanWithDays[]> {
    const plans = await db.query.trainingPlans.findMany({
      where: eq(trainingPlans.userId, userId),
      with: {
        trainingDays: {
          with: {
            exercises: {
              orderBy: (exercises, { asc }) => [asc(exercises.order)]
            }
          }
        }
      }
    });
    return plans as TrainingPlanWithDays[];
  }

  async createTrainingPlan(userId: string, data: InsertTrainingPlan): Promise<TrainingPlan> {
    const [plan] = await db.insert(trainingPlans).values({ ...data, userId }).returning();
    return plan;
  }

  async deleteTrainingPlan(id: number, userId: string): Promise<void> {
    // Get all days in the plan
    const days = await db.select().from(trainingDays).where(eq(trainingDays.planId, id));
    for (const day of days) {
      // delete weight history
      const exs = await db.select().from(exercises).where(eq(exercises.trainingDayId, day.id));
      for (const ex of exs) {
        await db.delete(weightHistory).where(eq(weightHistory.exerciseId, ex.id));
      }
      await db.delete(exercises).where(eq(exercises.trainingDayId, day.id));
    }
    await db.delete(trainingDays).where(eq(trainingDays.planId, id));
    await db.delete(trainingPlans).where(and(eq(trainingPlans.id, id), eq(trainingPlans.userId, userId)));
  }

  async getTrainingDays(userId: string): Promise<TrainingDayWithExercises[]> {
    const days = await db.query.trainingDays.findMany({
      where: and(eq(trainingDays.userId, userId), isNull(trainingDays.planId)),
      with: {
        exercises: {
          orderBy: (exercises, { asc }) => [asc(exercises.order)]
        }
      }
    });
    return days as TrainingDayWithExercises[];
  }

  async createTrainingDay(userId: string, data: InsertTrainingDay): Promise<TrainingDay> {
    const [day] = await db.insert(trainingDays).values({ ...data, userId }).returning();
    return day;
  }

  async renameTrainingDay(id: number, userId: string, name: string): Promise<TrainingDay | undefined> {
    const [day] = await db
      .update(trainingDays)
      .set({ name })
      .where(and(eq(trainingDays.id, id), eq(trainingDays.userId, userId)))
      .returning();
    return day;
  }

  async deleteTrainingDay(id: number, userId: string): Promise<void> {
    const exs = await db.select().from(exercises).where(eq(exercises.trainingDayId, id));
    for (const ex of exs) {
      await db.delete(weightHistory).where(eq(weightHistory.exerciseId, ex.id));
    }
    await db.delete(exercises).where(eq(exercises.trainingDayId, id));
    await db.delete(trainingDays).where(and(eq(trainingDays.id, id), eq(trainingDays.userId, userId)));
  }

  async createExercise(data: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(data).returning();
    // Record initial weight in history
    await db.insert(weightHistory).values({ exerciseId: exercise.id, weight: exercise.weight });
    return exercise;
  }

  async updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const [exercise] = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
    return exercise;
  }

  async incrementExerciseWeight(id: number): Promise<Exercise | undefined> {
    const [current] = await db.select().from(exercises).where(eq(exercises.id, id));
    if (!current) return undefined;
    const newWeight = Math.round((current.weight + current.increment) * 100) / 100;
    const [updated] = await db.update(exercises)
      .set({ weight: newWeight })
      .where(eq(exercises.id, id))
      .returning();
    await db.insert(weightHistory).values({ exerciseId: id, weight: newWeight });
    return updated;
  }

  async decrementExerciseWeight(id: number): Promise<Exercise | undefined> {
    const [current] = await db.select().from(exercises).where(eq(exercises.id, id));
    if (!current) return undefined;
    const newWeight = Math.max(0, Math.round((current.weight - current.increment) * 100) / 100);
    const [updated] = await db.update(exercises)
      .set({ weight: newWeight })
      .where(eq(exercises.id, id))
      .returning();
    await db.insert(weightHistory).values({ exerciseId: id, weight: newWeight });
    return updated;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(weightHistory).where(eq(weightHistory.exerciseId, id));
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async getWeightHistory(exerciseId: number): Promise<WeightHistory[]> {
    return db.select().from(weightHistory).where(eq(weightHistory.exerciseId, exerciseId));
  }

  async getAllTrainingDaysForUser(userId: string): Promise<TrainingDayWithExercises[]> {
    const days = await db.query.trainingDays.findMany({
      where: eq(trainingDays.userId, userId),
      with: {
        exercises: {
          orderBy: (exercises, { asc }) => [asc(exercises.order)]
        }
      }
    });
    return days as TrainingDayWithExercises[];
  }

  async getAnalyticsData(userId: string): Promise<AnalyticsItem[]> {
    const allDays = await db.query.trainingDays.findMany({
      where: eq(trainingDays.userId, userId),
      with: { exercises: true }
    });

    const allExerciseIds = allDays.flatMap(d => d.exercises.map(e => e.id));
    if (allExerciseIds.length === 0) return [];

    const allHistory = await db.select()
      .from(weightHistory)
      .where(inArray(weightHistory.exerciseId, allExerciseIds));

    const historyByExercise = new Map<number, WeightHistory[]>();
    for (const h of allHistory) {
      if (!historyByExercise.has(h.exerciseId)) historyByExercise.set(h.exerciseId, []);
      historyByExercise.get(h.exerciseId)!.push(h);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return allDays.flatMap(day =>
      day.exercises.map(ex => {
        const history = (historyByExercise.get(ex.id) || [])
          .sort((a, b) => new Date(a.recordedAt!).getTime() - new Date(b.recordedAt!).getTime());

        const oldEntry = history.find(h =>
          h.recordedAt && new Date(h.recordedAt) <= thirtyDaysAgo
        ) || history[0];

        const currentWeight = ex.weight;
        const oldWeight = oldEntry?.weight ?? currentWeight;
        const percentChange = oldWeight > 0
          ? Math.round(((currentWeight - oldWeight) / oldWeight) * 1000) / 10
          : 0;

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          dayName: day.name,
          currentWeight,
          oldWeight,
          percentChange,
        };
      })
    );
  }
}

export const storage = new DatabaseStorage();
