import { z } from "zod";

import {
  checklistContentSchema,
  expenseContentSchema,
  goalContentSchema,
  habitContentSchema,
  noteContentSchema,
  progressContentSchema,
} from "../../shared/schemas/cardSchemas";

export const cardFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("goal"),
    title: z.string().min(1, "Title is required").max(80),
    content: goalContentSchema,
  }),
  z.object({
    type: z.literal("checklist"),
    title: z.string().min(1, "Title is required").max(80),
    content: checklistContentSchema,
  }),
  z.object({
    type: z.literal("habit"),
    title: z.string().min(1, "Title is required").max(80),
    content: habitContentSchema,
  }),
  z.object({
    type: z.literal("expense"),
    title: z.string().min(1, "Title is required").max(80),
    content: expenseContentSchema,
  }),
  z.object({
    type: z.literal("progress"),
    title: z.string().min(1, "Title is required").max(80),
    content: progressContentSchema,
  }),
  z.object({
    type: z.literal("note"),
    title: z.string().min(1, "Title is required").max(80),
    content: noteContentSchema,
  }),
]);

export type CardFormValues = z.infer<typeof cardFormSchema>;
