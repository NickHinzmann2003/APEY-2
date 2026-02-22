import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

async function seedDatabase() {
  const existingClasses = await storage.getClasses();
  if (existingClasses.length === 0) {
    const today = new Date();
    
    await storage.createClass({
      title: "Yoga für Anfänger",
      description: "Ein entspannter Einstieg in die Welt des Yoga. Fokus auf Atmung und Beweglichkeit.",
      instructor: "Sarah Müller",
      capacity: 15,
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 18, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 19, 0),
    });
    
    await storage.createClass({
      title: "HIIT Workout",
      description: "Hochintensives Intervalltraining. Verbessere deine Ausdauer und verbrenne Kalorien.",
      instructor: "Max Mustermann",
      capacity: 10,
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 19, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 20, 0),
    });

    await storage.createClass({
      title: "Zumba",
      description: "Tanz-Workout zu lateinamerikanischen Rhythmen. Macht Spaß und fit.",
      instructor: "Laura Garcia",
      capacity: 20,
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up auth first
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.classes.list.path, async (req, res) => {
    const classesList = await storage.getClasses();
    res.json(classesList);
  });

  app.get(api.classes.get.path, async (req, res) => {
    const cls = await storage.getClass(Number(req.params.id));
    if (!cls) {
      return res.status(404).json({ message: "Kurs nicht gefunden" });
    }
    res.json(cls);
  });

  app.post(api.classes.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.classes.create.input.parse(req.body);
      const cls = await storage.createClass({
        ...input,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime)
      });
      res.status(201).json(cls);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.bookings.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const bookingsList = await storage.getUserBookings(userId);
    res.json(bookingsList);
  });

  app.post(api.bookings.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.bookings.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const cls = await storage.getClass(input.classId);
      if (!cls) {
         return res.status(404).json({ message: "Kurs nicht gefunden" });
      }

      // Check if user already booked
      const userBookings = await storage.getUserBookings(userId);
      if (userBookings.some(b => b.classId === input.classId)) {
        return res.status(400).json({ message: "Kurs ist bereits gebucht" });
      }

      // Check capacity
      const allClasses = await storage.getClasses();
      const targetClass = allClasses.find(c => c.id === input.classId);
      if (targetClass && targetClass.bookingsCount >= targetClass.capacity) {
         return res.status(400).json({ message: "Kurs ist bereits ausgebucht" });
      }
      
      const booking = await storage.createBooking(userId, input.classId);
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.bookings.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const bookingId = Number(req.params.id);
    await storage.deleteBooking(bookingId, userId);
    res.status(204).end();
  });

  // Call seed in background
  seedDatabase().catch(console.error);

  return httpServer;
}
