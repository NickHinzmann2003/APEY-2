import { z } from "zod";
import { insertClassSchema, classes, bookings } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes' as const,
      responses: {
        200: z.array(z.custom<typeof classes.$inferSelect & { bookingsCount: number }>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/classes/:id' as const,
      responses: {
        200: z.custom<typeof classes.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes' as const,
      input: insertClassSchema,
      responses: {
        201: z.custom<typeof classes.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  bookings: {
    list: {
      method: 'GET' as const,
      path: '/api/bookings' as const,
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect & { class: typeof classes.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/bookings' as const,
      input: z.object({ classId: z.coerce.number() }),
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/bookings/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ClassResponse = z.infer<typeof api.classes.list.responses[200]>[0];
export type BookingResponse = z.infer<typeof api.bookings.list.responses[200]>[0];
