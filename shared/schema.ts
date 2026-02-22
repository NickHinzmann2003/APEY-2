import { pgTable, text, serial, integer, timestamp, varchar, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const trainingDays = pgTable("training_days", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
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

export const trainingDaysRelations = relations(trainingDays, ({ one, many }) => ({
  user: one(users, {
    fields: [trainingDays.userId],
    references: [users.id],
  }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  trainingDay: one(trainingDays, {
    fields: [exercises.trainingDayId],
    references: [trainingDays.id],
  }),
}));

export const insertTrainingDaySchema = createInsertSchema(trainingDays).omit({ id: true, createdAt: true, userId: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });

export type TrainingDay = typeof trainingDays.$inferSelect;
export type InsertTrainingDay = z.infer<typeof insertTrainingDaySchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
