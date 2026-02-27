import { pgTable, text, serial, integer, timestamp, varchar, real, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const DEFAULT_CATEGORIES = ["Brust", "Rücken", "Arme", "Beine", "Bauch"] as const;

export const exerciseTemplates = pgTable("exercise_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  category: text("category"),
  defaultSets: integer("default_sets").default(3),
  defaultRepsMin: integer("default_reps_min").default(8),
  defaultRepsMax: integer("default_reps_max").default(12),
  defaultWeight: real("default_weight").default(20),
  defaultIncrement: real("default_increment").default(2.5),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  exerciseTemplateId: integer("exercise_template_id").references(() => exerciseTemplates.id),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  repsMin: integer("reps_min").notNull().default(8),
  repsMax: integer("reps_max").notNull().default(12),
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

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").references(() => exercises.id).notNull(),
  weight: real("weight").notNull(),
  setsCompleted: integer("sets_completed").notNull(),
  totalSets: integer("total_sets").notNull(),
  repsAchieved: boolean("reps_achieved").notNull().default(false),
  setWeights: text("set_weights"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const exerciseTemplatesRelations = relations(exerciseTemplates, ({ one }) => ({
  user: one(users, {
    fields: [exerciseTemplates.userId],
    references: [users.id],
  }),
}));

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
  template: one(exerciseTemplates, {
    fields: [exercises.exerciseTemplateId],
    references: [exerciseTemplates.id],
  }),
  weightHistory: many(weightHistory),
  workoutLogs: many(workoutLogs),
}));

export const weightHistoryRelations = relations(weightHistory, ({ one }) => ({
  exercise: one(exercises, {
    fields: [weightHistory.exerciseId],
    references: [exercises.id],
  }),
}));

export const workoutLogsRelations = relations(workoutLogs, ({ one }) => ({
  exercise: one(exercises, {
    fields: [workoutLogs.exerciseId],
    references: [exercises.id],
  }),
}));

export const insertExerciseTemplateSchema = createInsertSchema(exerciseTemplates).omit({ id: true, createdAt: true, userId: true });
export const insertTrainingPlanSchema = createInsertSchema(trainingPlans).omit({ id: true, createdAt: true, userId: true });
export const insertTrainingDaySchema = createInsertSchema(trainingDays).omit({ id: true, createdAt: true, userId: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true, completedAt: true });

export type ExerciseTemplate = typeof exerciseTemplates.$inferSelect;
export type InsertExerciseTemplate = z.infer<typeof insertExerciseTemplateSchema>;

export type TrainingPlan = typeof trainingPlans.$inferSelect;
export type InsertTrainingPlan = z.infer<typeof insertTrainingPlanSchema>;

export type TrainingDay = typeof trainingDays.$inferSelect;
export type InsertTrainingDay = z.infer<typeof insertTrainingDaySchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type WeightHistory = typeof weightHistory.$inferSelect;

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
