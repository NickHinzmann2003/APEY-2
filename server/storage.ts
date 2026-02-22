import { db } from "./db";
import { classes, bookings, type InsertClass, type InsertBooking, type Class, type Booking } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getClasses(): Promise<(Class & { bookingsCount: number })[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(cls: InsertClass): Promise<Class>;
  
  getUserBookings(userId: string): Promise<(Booking & { class: Class })[]>;
  createBooking(userId: string, classId: number): Promise<Booking>;
  deleteBooking(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getClasses(): Promise<(Class & { bookingsCount: number })[]> {
    const results = await db
      .select({
        class: classes,
        bookingsCount: sql<number>`count(${bookings.id})::int`
      })
      .from(classes)
      .leftJoin(bookings, eq(classes.id, bookings.classId))
      .groupBy(classes.id)
      .orderBy(classes.startTime);
      
    return results.map(row => ({
      ...row.class,
      bookingsCount: row.bookingsCount
    }));
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const [cls] = await db.insert(classes).values(insertClass).returning();
    return cls;
  }

  async getUserBookings(userId: string): Promise<(Booking & { class: Class })[]> {
    const results = await db
      .select({
        booking: bookings,
        class: classes
      })
      .from(bookings)
      .innerJoin(classes, eq(bookings.classId, classes.id))
      .where(eq(bookings.userId, userId))
      .orderBy(bookings.createdAt);
      
    return results.map(row => ({
      ...row.booking,
      class: row.class
    }));
  }

  async createBooking(userId: string, classId: number): Promise<Booking> {
    const [booking] = await db.insert(bookings).values({ userId, classId }).returning();
    return booking;
  }

  async deleteBooking(id: number, userId: string): Promise<void> {
    await db.delete(bookings).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
