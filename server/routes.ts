import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/exercise-templates", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const templates = await storage.getExerciseTemplates(userId);
    res.json(templates);
  });

  app.post("/api/exercise-templates", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const template = await storage.createExerciseTemplate(userId, req.body);
    res.status(201).json(template);
  });

  app.delete("/api/exercise-templates/:id", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    await storage.deleteExerciseTemplate(Number(req.params.id), userId);
    res.status(204).end();
  });

  app.get("/api/training-plans", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const plans = await storage.getTrainingPlans(userId);
    res.json(plans);
  });

  app.post("/api/training-plans", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const plan = await storage.createTrainingPlan(userId, req.body);
    res.status(201).json(plan);
  });

  app.delete("/api/training-plans/:id", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    await storage.deleteTrainingPlan(Number(req.params.id), userId);
    res.status(204).end();
  });

  app.get("/api/training-days", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const days = await storage.getTrainingDays(userId);
    res.json(days);
  });

  app.get("/api/all-training-days", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const days = await storage.getAllTrainingDaysForUser(userId);
    res.json(days);
  });

  app.post("/api/training-days", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const day = await storage.createTrainingDay(userId, req.body);
    res.status(201).json(day);
  });

  app.patch("/api/training-days/:id", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Name erforderlich" });
    }
    const day = await storage.renameTrainingDay(Number(req.params.id), userId, name);
    if (!day) return res.status(404).json({ message: "Trainingstag nicht gefunden" });
    res.json(day);
  });

  app.delete("/api/training-days/:id", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    await storage.deleteTrainingDay(Number(req.params.id), userId);
    res.status(204).end();
  });

  app.post("/api/exercises", isAuthenticated, async (req, res) => {
    const exercise = await storage.createExercise(req.body);
    res.status(201).json(exercise);
  });

  app.patch("/api/exercises/:id", isAuthenticated, async (req, res) => {
    const exercise = await storage.updateExercise(Number(req.params.id), req.body);
    res.json(exercise);
  });

  app.post("/api/exercises/:id/increment", isAuthenticated, async (req, res) => {
    const exercise = await storage.incrementExerciseWeight(Number(req.params.id));
    if (!exercise) return res.status(404).json({ message: "Übung nicht gefunden" });
    res.json(exercise);
  });

  app.post("/api/exercises/:id/decrement", isAuthenticated, async (req, res) => {
    const exercise = await storage.decrementExerciseWeight(Number(req.params.id));
    if (!exercise) return res.status(404).json({ message: "Übung nicht gefunden" });
    res.json(exercise);
  });

  app.get("/api/exercises/:id/history", isAuthenticated, async (req, res) => {
    const history = await storage.getWeightHistory(Number(req.params.id));
    res.json(history);
  });

  app.get("/api/exercises/:id/last-workout", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const log = await storage.getLastWorkoutLog(Number(req.params.id), userId);
    res.json(log ?? null);
  });

  app.delete("/api/exercises/:id", isAuthenticated, async (req, res) => {
    await storage.deleteExercise(Number(req.params.id));
    res.status(204).end();
  });

  app.post("/api/workout-logs", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { exerciseId, weight, setsCompleted, totalSets, repsAchieved } = req.body;
    if (!exerciseId || typeof weight !== "number" || typeof setsCompleted !== "number" || typeof totalSets !== "number") {
      return res.status(400).json({ message: "Ungültige Daten" });
    }
    const log = await storage.createWorkoutLog({
      exerciseId,
      weight,
      setsCompleted,
      totalSets,
      repsAchieved: !!repsAchieved,
    }, userId);
    if (!log) return res.status(403).json({ message: "Nicht berechtigt" });
    res.status(201).json(log);
  });

  app.get("/api/training-status", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const status = await storage.getTrainingStatus(userId);
    res.json(status);
  });

  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const data = await storage.getAnalyticsData(userId);
    res.json(data);
  });

  return httpServer;
}
