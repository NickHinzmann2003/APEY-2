import { pgTable, text, serial, integer, timestamp, varchar, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const trainingPlans = pgTable("training_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainingDays = pgTable("training_days", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: integer("plan_id").references(() => trainingPlans.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  trainingDayId: integer("training_day_id").references(() => trainingDays.id).notNull(),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  weight: real("weight").notNull(),
  increment: real("increment").notNull(),
  order: integer("order").notNull(),
});

export const weightHistory = pgTable("weight_history", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  weight: real("weight").notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

export const trainingPlansRelations = relations(trainingPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [trainingPlans.userId],
    references: [users.id],
  }),
  trainingDays: many(trainingDays),
}));

export const trainingDaysRelations = relations(trainingDays, ({ one, many }) => ({
  user: one(users, {
    fields: [trainingDays.userId],
    references: [users.id],
  }),
  plan: one(trainingPlans, {
    fields: [trainingDays.planId],
    references: [trainingPlans.id],
  }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  trainingDay: one(trainingDays, {
    fields: [exercises.trainingDayId],
    references: [trainingDays.id],
  }),
  weightHistory: many(weightHistory),
}));

export const weightHistoryRelations = relations(weightHistory, ({ one }) => ({
  exercise: one(exercises, {
    fields: [weightHistory.exerciseId],
    references: [exercises.id],
  }),
}));

export const insertTrainingPlanSchema = createInsertSchema(trainingPlans).omit({ id: true, createdAt: true, userId: true });
export const insertTrainingDaySchema = createInsertSchema(trainingDays).omit({ id: true, createdAt: true, userId: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });

export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type InsertTrainingPlan = z.infer<typeof insertTrainingPlanSchema>;

export type TrainingDay = typeof trainingDays.$inferSelect;
export type InsertTrainingDay = z.infer<typeof insertTrainingDaySchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type WeightHistory = typeof weightHistory.$inferSelect;
