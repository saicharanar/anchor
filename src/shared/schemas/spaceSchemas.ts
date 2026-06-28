import { z } from "zod";

export const spaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const spaceFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(40, "Use 40 characters or fewer"),
  description: z.string().max(160, "Use 160 characters or fewer"),
  icon: z.string(),
  color: z.string(),
});

export type SpaceFormValues = z.infer<typeof spaceFormSchema>;
