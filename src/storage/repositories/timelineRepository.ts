import { anchorDatabase } from "../db";
import { getExpenseTransactionType } from "../../features/cards/cardMetrics";
import type { AnchorCard } from "../../shared/types/cards";
import type {
  TimelineData,
  TimelineGoal,
  TimelineHabit,
  TimelineHabitLog,
  TimelineTask,
  TimelineTransaction,
} from "../../shared/types/timeline";

export async function getTimelineData(): Promise<TimelineData> {
  await migrateCardsToTimelineIfNeeded();

  const [goals, tasks, habits, habitLogs, transactions] = await Promise.all([
    anchorDatabase.goals.toArray(),
    anchorDatabase.tasks.toArray(),
    anchorDatabase.habits.toArray(),
    anchorDatabase.habitLogs.toArray(),
    anchorDatabase.transactions.toArray(),
  ]);

  return { goals, tasks, habits, habitLogs, transactions };
}

export async function saveTimelineGoal(goal: TimelineGoal) {
  await anchorDatabase.goals.put(goal);
  return goal;
}

export async function saveTimelineTask(task: TimelineTask) {
  await anchorDatabase.tasks.put(task);
  return task;
}

export async function saveTimelineHabit(habit: TimelineHabit) {
  await anchorDatabase.habits.put(habit);
  return habit;
}

export async function saveTimelineHabitLog(log: TimelineHabitLog) {
  await anchorDatabase.habitLogs.put(log);
  return log;
}

export async function saveTimelineTransaction(transaction: TimelineTransaction) {
  await anchorDatabase.transactions.put(transaction);
  return transaction;
}

export async function deleteTimelineGoal(goalId: string) {
  await anchorDatabase.transaction("rw", anchorDatabase.goals, anchorDatabase.tasks, async () => {
    await anchorDatabase.goals.delete(goalId);
    await anchorDatabase.tasks.where("goalId").equals(goalId).delete();
  });
}

export async function deleteTimelineTask(taskId: string) {
  await anchorDatabase.transaction("rw", anchorDatabase.tasks, async () => {
    const childIds = await anchorDatabase.tasks.filter((task) => task.parentId === taskId).primaryKeys();
    await anchorDatabase.tasks.bulkDelete([taskId, ...childIds]);
  });
}

export async function deleteTimelineHabit(habitId: string) {
  await anchorDatabase.transaction("rw", anchorDatabase.habits, anchorDatabase.habitLogs, async () => {
    await anchorDatabase.habits.delete(habitId);
    await anchorDatabase.habitLogs.where("habitId").equals(habitId).delete();
  });
}

export async function deleteTimelineTransaction(transactionId: string) {
  await anchorDatabase.transactions.delete(transactionId);
}

export async function clearTimelineData() {
  await Promise.all([
    anchorDatabase.goals.clear(),
    anchorDatabase.tasks.clear(),
    anchorDatabase.habits.clear(),
    anchorDatabase.habitLogs.clear(),
    anchorDatabase.transactions.clear(),
  ]);
}

async function migrateCardsToTimelineIfNeeded() {
  const timelineCount = await Promise.all([
    anchorDatabase.goals.count(),
    anchorDatabase.tasks.count(),
    anchorDatabase.habits.count(),
    anchorDatabase.transactions.count(),
  ]);

  if (timelineCount.some((count) => count > 0)) {
    return;
  }

  const cards = await anchorDatabase.cards.toArray();

  if (cards.length === 0) {
    return;
  }

  const data = cards.reduce<TimelineData>(
    (result, card) => migrateCard(card, result),
    { goals: [], tasks: [], habits: [], habitLogs: [], transactions: [] },
  );

  await anchorDatabase.transaction(
    "rw",
    anchorDatabase.goals,
    anchorDatabase.tasks,
    anchorDatabase.habits,
    anchorDatabase.habitLogs,
    anchorDatabase.transactions,
    async () => {
      await anchorDatabase.goals.bulkPut(data.goals);
      await anchorDatabase.tasks.bulkPut(data.tasks);
      await anchorDatabase.habits.bulkPut(data.habits);
      await anchorDatabase.habitLogs.bulkPut(data.habitLogs);
      await anchorDatabase.transactions.bulkPut(data.transactions);
    },
  );
}

function migrateCard(card: AnchorCard, data: TimelineData) {
  if (card.type === "goal") {
    const linkedTag = normalizeTag(card.title);
    const goal: TimelineGoal = {
      id: `goal_${card.id}`,
      title: card.title,
      kind: "task",
      startDate: card.createdAt.slice(0, 10),
      targetDate: card.content.targetDate,
      linkedTag,
      completedAt: card.content.status === "complete" ? card.updatedAt.slice(0, 10) : undefined,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };

    data.goals.push(goal);
    card.content.tasks?.forEach((task) => {
      data.tasks.push({
        id: `task_${task.id}`,
        title: task.label,
        date: card.createdAt.slice(0, 10),
        completedAt: task.completed ? card.updatedAt.slice(0, 10) : undefined,
        goalId: goal.id,
        tags: [linkedTag],
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      });
    });
  }

  if (card.type === "checklist") {
    card.content.tasks.forEach((task) => {
      data.tasks.push({
        id: `task_${task.id}`,
        title: task.label,
        date: card.createdAt.slice(0, 10),
        completedAt: task.completed ? card.updatedAt.slice(0, 10) : undefined,
        tags: [],
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      });
    });
  }

  if (card.type === "habit") {
    const habitId = `habit_${card.id}`;
    data.habits.push({
      id: habitId,
      title: card.title,
      startDate: card.createdAt.slice(0, 10),
      tags: [normalizeTag(card.title)],
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
    card.content.logs.forEach((log) => {
      data.habitLogs.push({
        id: `habitlog_${card.id}_${log.date}`,
        habitId,
        date: log.date,
        completed: log.completed,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      });
    });
  }

  if (card.type === "expense") {
    data.transactions.push({
      id: `transaction_${card.id}`,
      title: card.title,
      amount: card.content.amount,
      type: getExpenseTransactionType(card),
      date: card.content.date,
      tags: [normalizeTag(card.content.category)],
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
  }

  return data;
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
}
