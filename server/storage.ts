import { db } from "./db";
import {
  exerciseTemplates, trainingPlans, trainingDays, exercises, weightHistory, workoutLogs,
  type ExerciseTemplate, type TrainingPlan, type TrainingDay, type Exercise, type WeightHistory, type WorkoutLog,
  type InsertExerciseTemplate, type InsertTrainingPlan, type InsertTrainingDay, type InsertExercise, type InsertWorkoutLog
} from "@shared/schema";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";

export type TrainingDayWithExercises = TrainingDay & { exercises: Exercise[] };
export type TrainingPlanWithDays = TrainingPlan & { trainingDays: TrainingDayWithExercises[] };

export type AnalyticsItem = {
  exerciseId: number;
  exerciseName: string;
  dayName: string;
  templateId: number | null;
  currentWeight: number;
  oldWeight: number;
  percentChange: number;
};

export interface IStorage {
  getExerciseTemplates(userId: string): Promise<ExerciseTemplate[]>;
  createExerciseTemplate(userId: string, data: InsertExerciseTemplate): Promise<ExerciseTemplate>;
  deleteExerciseTemplate(id: number, userId: string): Promise<void>;

  getTrainingPlans(userId: string): Promise<TrainingPlanWithDays[]>;
  createTrainingPlan(userId: string, data: InsertTrainingPlan): Promise<TrainingPlan>;
  deleteTrainingPlan(id: number, userId: string): Promise<void>;

  getTrainingDays(userId: string): Promise<TrainingDayWithExercises[]>;
  getAllTrainingDaysForUser(userId: string): Promise<TrainingDayWithExercises[]>;
  createTrainingDay(userId: string, data: InsertTrainingDay): Promise<TrainingDay>;
  renameTrainingDay(id: number, userId: string, name: string): Promise<TrainingDay | undefined>;
  deleteTrainingDay(id: number, userId: string): Promise<void>;

  createExercise(data: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise | undefined>;
  incrementExerciseWeight(id: number): Promise<Exercise | undefined>;
  decrementExerciseWeight(id: number): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
  getWeightHistory(exerciseId: number): Promise<WeightHistory[]>;

  getLastWorkoutLog(exerciseId: number, userId: string): Promise<WorkoutLog | undefined>;
  createWorkoutLog(data: InsertWorkoutLog, userId: string): Promise<WorkoutLog | undefined>;

  getAnalyticsData(userId: string): Promise<AnalyticsItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getExerciseTemplates(userId: string): Promise<ExerciseTemplate[]> {
    return db.select().from(exerciseTemplates)
      .where(eq(exerciseTemplates.userId, userId))
      .orderBy(exerciseTemplates.name);
  }

  async createExerciseTemplate(userId: string, data: InsertExerciseTemplate): Promise<ExerciseTemplate> {
    const [template] = await db.insert(exerciseTemplates).values({ ...data, userId }).returning();
    return template;
  }

  async deleteExerciseTemplate(id: number, userId: string): Promise<void> {
    await db.update(exercises)
      .set({ exerciseTemplateId: null })
      .where(eq(exercises.exerciseTemplateId, id));
    await db.delete(exerciseTemplates)
      .where(and(eq(exerciseTemplates.id, id), eq(exerciseTemplates.userId, userId)));
  }

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
    const days = await db.select().from(trainingDays).where(eq(trainingDays.planId, id));
    for (const day of days) {
      const exs = await db.select().from(exercises).where(eq(exercises.trainingDayId, day.id));
      for (const ex of exs) {
        await db.delete(workoutLogs).where(eq(workoutLogs.exerciseId, ex.id));
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
      await db.delete(workoutLogs).where(eq(workoutLogs.exerciseId, ex.id));
      await db.delete(weightHistory).where(eq(weightHistory.exerciseId, ex.id));
    }
    await db.delete(exercises).where(eq(exercises.trainingDayId, id));
    await db.delete(trainingDays).where(and(eq(trainingDays.id, id), eq(trainingDays.userId, userId)));
  }

  async createExercise(data: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(data).returning();
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
    await db.delete(workoutLogs).where(eq(workoutLogs.exerciseId, id));
    await db.delete(weightHistory).where(eq(weightHistory.exerciseId, id));
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async getWeightHistory(exerciseId: number): Promise<WeightHistory[]> {
    return db.select().from(weightHistory).where(eq(weightHistory.exerciseId, exerciseId));
  }

  async getLastWorkoutLog(exerciseId: number, userId: string): Promise<WorkoutLog | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
    if (!exercise) return undefined;
    const [day] = await db.select().from(trainingDays).where(eq(trainingDays.id, exercise.trainingDayId));
    if (!day || day.userId !== userId) return undefined;
    const [log] = await db.select().from(workoutLogs)
      .where(eq(workoutLogs.exerciseId, exerciseId))
      .orderBy(desc(workoutLogs.completedAt))
      .limit(1);
    return log;
  }

  async createWorkoutLog(data: InsertWorkoutLog, userId: string): Promise<WorkoutLog | undefined> {
    const [exercise] = await db.select().from(exercises).where(eq(exercises.id, data.exerciseId));
    if (!exercise) return undefined;
    const [day] = await db.select().from(trainingDays).where(eq(trainingDays.id, exercise.trainingDayId));
    if (!day || day.userId !== userId) return undefined;
    const [log] = await db.insert(workoutLogs).values(data).returning();
    return log;
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

    const historyByExercise = new Map<number, (typeof allHistory)[number][]>();
    for (const h of allHistory) {
      if (!historyByExercise.has(h.exerciseId)) historyByExercise.set(h.exerciseId, []);
      historyByExercise.get(h.exerciseId)!.push(h);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const rawItems = allDays.flatMap(day =>
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
          templateId: ex.exerciseTemplateId,
          currentWeight,
          oldWeight,
          percentChange,
        };
      })
    );

    const grouped = new Map<string, AnalyticsItem>();
    for (const item of rawItems) {
      const key = item.templateId ? `t_${item.templateId}` : `n_${item.exerciseId}`;
      const existing = grouped.get(key);
      if (!existing || item.currentWeight > existing.currentWeight) {
        grouped.set(key, item);
      }
    }

    return Array.from(grouped.values());
  }
}

export const storage = new DatabaseStorage();
