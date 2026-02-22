import { db } from "./db";
import { trainingDays, exercises, type TrainingDay, type Exercise, type InsertTrainingDay, type InsertExercise } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getTrainingDays(userId: string): Promise<(TrainingDay & { exercises: Exercise[] })[]>;
  createTrainingDay(userId: string, data: InsertTrainingDay): Promise<TrainingDay>;
  deleteTrainingDay(id: number, userId: string): Promise<void>;
  
  createExercise(data: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise | undefined>;
  incrementExerciseWeight(id: number): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTrainingDays(userId: string): Promise<(TrainingDay & { exercises: Exercise[] })[]> {
    const days = await db.query.trainingDays.findMany({
      where: eq(trainingDays.userId, userId),
      with: {
        exercises: {
          orderBy: (exercises, { asc }) => [asc(exercises.order)]
        }
      }
    });
    return days;
  }

  async createTrainingDay(userId: string, data: InsertTrainingDay): Promise<TrainingDay> {
    const [day] = await db.insert(trainingDays).values({ ...data, userId }).returning();
    return day;
  }

  async deleteTrainingDay(id: number, userId: string): Promise<void> {
    // Delete exercises first
    await db.delete(exercises).where(eq(exercises.trainingDayId, id));
    await db.delete(trainingDays).where(and(eq(trainingDays.id, id), eq(trainingDays.userId, userId)));
  }

  async createExercise(data: InsertExercise): Promise<Exercise> {
    const [exercise] = await db.insert(exercises).values(data).returning();
    return exercise;
  }

  async updateExercise(id: number, data: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const [exercise] = await db.update(exercises).set(data).where(eq(exercises.id, id)).returning();
    return exercise;
  }

  async incrementExerciseWeight(id: number): Promise<Exercise | undefined> {
    const [current] = await db.select().from(exercises).where(eq(exercises.id, id));
    if (!current) return undefined;
    
    const [updated] = await db.update(exercises)
      .set({ weight: current.weight + current.increment })
      .where(eq(exercises.id, id))
      .returning();
    return updated;
  }

  async deleteExercise(id: number): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }
}

export const storage = new DatabaseStorage();
