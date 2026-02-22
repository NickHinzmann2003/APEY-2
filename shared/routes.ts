import { z } from "zod";
import { insertTrainingDaySchema, insertExerciseSchema, trainingDays, exercises } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  trainingDays: {
    list: {
      method: 'GET' as const,
      path: '/api/training-days' as const,
      responses: {
        200: z.array(z.custom<typeof trainingDays.$inferSelect & { exercises: (typeof exercises.$inferSelect)[] }>()),
        401: errorSchemas.unauthorized,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/training-days' as const,
      input: insertTrainingDaySchema,
      responses: {
        201: z.custom<typeof trainingDays.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/training-days/:id' as const,
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  exercises: {
    create: {
      method: 'POST' as const,
      path: '/api/exercises' as const,
      input: insertExerciseSchema,
      responses: {
        201: z.custom<typeof exercises.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/exercises/:id' as const,
      input: insertExerciseSchema.partial(),
      responses: {
        200: z.custom<typeof exercises.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    increment: {
      method: 'POST' as const,
      path: '/api/exercises/:id/increment' as const,
      responses: {
        200: z.custom<typeof exercises.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/exercises/:id' as const,
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
