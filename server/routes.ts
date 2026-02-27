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

  // Training Plans
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

  // Training Days (standalone, no plan)
  app.get("/api/training-days", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const days = await storage.getTrainingDays(userId);
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

  // Exercises
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

  app.delete("/api/exercises/:id", isAuthenticated, async (req, res) => {
    await storage.deleteExercise(Number(req.params.id));
    res.status(204).end();
  });

  app.get("/api/all-training-days", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const days = await storage.getAllTrainingDaysForUser(userId);
    res.json(days);
  });

  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const data = await storage.getAnalyticsData(userId);
    res.json(data);
  });

  return httpServer;
}
