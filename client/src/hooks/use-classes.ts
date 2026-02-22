import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ClassResponse } from "@shared/routes";
import { z } from "zod";

export function useClasses() {
  return useQuery({
    queryKey: [api.classes.list.path],
    queryFn: async () => {
      const res = await fetch(api.classes.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch classes");
      }
      const data = await res.json();
      return api.classes.list.responses[200].parse(data);
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.classes.create.input>) => {
      const validated = api.classes.create.input.parse(data);
      const res = await fetch(api.classes.create.path, {
        method: api.classes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create class");
      }
      return api.classes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classes.list.path] });
    },
  });
}
