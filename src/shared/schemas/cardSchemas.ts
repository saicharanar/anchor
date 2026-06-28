import { z } from "zod";

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Task label is required"),
  completed: z.boolean(),
});

export const habitLogSchema = z.object({
  date: z.string(),
  completed: z.boolean(),
});

export const goalContentSchema = z.object({
  description: z.string(),
  targetDate: z.string(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(["not-started", "in-progress", "paused", "complete"]),
  tasks: z.array(checklistItemSchema).optional(),
});

export const checklistContentSchema = z.object({
  tasks: z.array(checklistItemSchema),
});

export const habitContentSchema = z.object({
  frequency: z.enum(["daily", "weekly"]),
  logs: z.array(habitLogSchema),
});

export const expenseContentSchema = z.object({
  amount: z.number().min(0),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  recurring: z.boolean(),
  transactionType: z.enum(["spent", "credited"]),
});

export const progressContentSchema = z.object({
  currentValue: z.number().min(0),
  targetValue: z.number().min(1),
  unit: z.string().min(1, "Unit is required"),
});

export const noteContentSchema = z.object({
  content: z.string(),
  tags: z.array(z.string()),
});

export const cardSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    spaceId: z.string(),
    type: z.literal("goal"),
    title: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    content: goalContentSchema,
  }),
  z.object({
    id: z.string(),
    spaceId: z.string(),
    type: z.literal("checklist"),
    title: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    content: checklistContentSchema,
  }),
  z.object({
    id: z.string(),
    spaceId: z.string(),
    type: z.literal("habit"),
    title: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    content: habitContentSchema,
  }),
  z.object({
    id: z.string(),
    spaceId: z.string(),
    type: z.literal("expense"),
    title: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    content: expenseContentSchema,
  }),
  z.object({
    id: z.string(),
    spaceId: z.string(),
    type: z.literal("progress"),
    title: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    content: progressContentSchema,
  }),
  z.object({
    id: z.string(),
    spaceId: z.string(),
    type: z.literal("note"),
    title: z.string().min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
    content: noteContentSchema,
  }),
]);
