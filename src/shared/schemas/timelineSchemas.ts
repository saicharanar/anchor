import { z } from "zod";

export const timelineGoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["money", "task"]),
  startDate: z.string(),
  targetDate: z.string(),
  targetAmount: z.number().optional(),
  linkedTag: z.string(),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const timelineTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  completedAt: z.string().optional(),
  goalId: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const timelineHabitSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string(),
  archivedAt: z.string().optional(),
  goalId: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const timelineHabitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const timelineTransactionSchema = z.object({
  id: z.string(),
  title: z.string(),
  amount: z.number(),
  type: z.enum(["spent", "credited"]),
  date: z.string(),
  goalId: z.string().optional(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const timelineDataSchema = z.object({
  goals: z.array(timelineGoalSchema),
  tasks: z.array(timelineTaskSchema),
  habits: z.array(timelineHabitSchema),
  habitLogs: z.array(timelineHabitLogSchema),
  transactions: z.array(timelineTransactionSchema),
});
