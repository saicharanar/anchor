import type {
  GoalSnapshot,
  TimelineData,
  TimelineGoal,
  TimelineHabit,
  TimelineHabitLog,
  TimelineTask,
  TimelineTransaction,
} from "../../shared/types/timeline";
import { formatDateInputValue } from "../../shared/utils/dates";

const dayInMilliseconds = 86_400_000;

export function getTasksForDate(tasks: TimelineTask[], date: string) {
  return tasks.filter((task) => !task.parentId && task.date === date).sort(sortByCreatedAt);
}

export function getOverdueTasksForDate(tasks: TimelineTask[], date: string) {
  return tasks
    .filter((task) => !task.parentId && task.date < date && (!task.completedAt || task.completedAt > date))
    .sort(sortByCreatedAt);
}

export function getSubtasks(tasks: TimelineTask[], parentId: string) {
  return tasks.filter((task) => task.parentId === parentId).sort(sortByCreatedAt);
}

export function isTaskComplete(task: TimelineTask, subtasks: TimelineTask[]) {
  if (subtasks.length === 0) {
    return Boolean(task.completedAt);
  }

  return subtasks.every((subtask) => Boolean(subtask.completedAt));
}

export function getOverdueDayCount(taskDate: string, referenceDate: string) {
  const taskTime = new Date(`${taskDate}T00:00:00`).getTime();
  const referenceTime = new Date(`${referenceDate}T00:00:00`).getTime();
  return Math.max(0, Math.round((referenceTime - taskTime) / dayInMilliseconds));
}

export function getHabitsForDate(habits: TimelineHabit[], date: string) {
  return habits
    .filter((habit) => habit.startDate <= date && (!habit.archivedAt || habit.archivedAt > date))
    .sort(sortByCreatedAt);
}

export function getHabitLogForDate(habitLogs: TimelineHabitLog[], habitId: string, date: string) {
  return habitLogs.find((log) => log.habitId === habitId && log.date === date);
}

export function getTransactionsForDate(transactions: TimelineTransaction[], date: string) {
  return transactions.filter((transaction) => transaction.date === date).sort(sortByCreatedAt);
}

export function getGoalSnapshots(data: TimelineData, date: string): GoalSnapshot[] {
  return data.goals.map((goal) => getGoalSnapshot(goal, data, date)).sort(sortGoalSnapshots);
}

export function getGoalSnapshot(goal: TimelineGoal, data: TimelineData, date: string): GoalSnapshot {
  const progressValue = getGoalProgressValue(goal, data, date);
  const targetAmount = goal.targetAmount ?? getTaskGoalTarget(goal, data);
  const progressRatio = targetAmount <= 0 ? 0 : Math.min(1, progressValue / targetAmount);
  const completedAt = goal.completedAt ?? getComputedCompletionDate(goal, data);

  return {
    goal,
    progressValue,
    progressRatio,
    isActiveOnDate: goal.startDate <= date && (!completedAt || completedAt >= date),
    isCompleteAsOfDate: Boolean(completedAt && completedAt <= date),
    completedAt,
  };
}

export function getGoalProgressValue(goal: TimelineGoal, data: TimelineData, date: string) {
  if (goal.kind === "money") {
    return data.transactions
      .filter((transaction) => isLinkedToGoal(transaction, goal) && transaction.date <= date)
      .reduce((total, transaction) => total + getSignedTransactionAmount(transaction), 0);
  }

  return data.tasks.filter((task) => isLinkedToGoal(task, goal) && task.completedAt && task.completedAt <= date).length;
}

export function getComputedCompletionDate(goal: TimelineGoal, data: TimelineData) {
  const targetAmount = goal.targetAmount ?? getTaskGoalTarget(goal, data);

  if (targetAmount <= 0) {
    return undefined;
  }

  const dates = getGoalEventDates(goal, data);
  return dates.find((date) => getGoalProgressValue(goal, data, date) >= targetAmount);
}

export function getDateOffset(date: string, offset: number) {
  const nextDate = new Date(`${date}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + offset);
  return formatDateInputValue(nextDate);
}

export function getRelativeDayLabel(date: string, today: string) {
  if (date === today) {
    return "Today";
  }

  const dateTime = new Date(`${date}T00:00:00`).getTime();
  const todayTime = new Date(`${today}T00:00:00`).getTime();
  const dayDifference = Math.round((dateTime - todayTime) / dayInMilliseconds);

  if (dayDifference === -1) {
    return "Yesterday";
  }

  if (dayDifference === 1) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T00:00:00`));
}

export function getGoalStatusLine(snapshot: GoalSnapshot, selectedDate: string) {
  const { completedAt, goal, isCompleteAsOfDate } = snapshot;

  if (selectedDate < goal.startDate) {
    return `Starts ${formatCompactDate(goal.startDate)}`;
  }

  if (isCompleteAsOfDate && completedAt) {
    return `Completed ${formatCompactDate(completedAt)}`;
  }

  if (completedAt && completedAt > selectedDate) {
    return `Completed ${formatCompactDate(completedAt)}`;
  }

  if (goal.targetDate < selectedDate) {
    return "Past target";
  }

  return `Due ${formatCompactDate(goal.targetDate)}`;
}

export function formatCompactDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function getTaskGoalTarget(goal: TimelineGoal, data: TimelineData) {
  return data.tasks.filter((task) => isLinkedToGoal(task, goal)).length;
}

function getGoalEventDates(goal: TimelineGoal, data: TimelineData) {
  if (goal.kind === "money") {
    return getUniqueSortedDates(
      data.transactions.filter((transaction) => isLinkedToGoal(transaction, goal)).map((transaction) => transaction.date),
    );
  }

  return getUniqueSortedDates(
    data.tasks
      .filter((task) => isLinkedToGoal(task, goal))
      .flatMap((task) => task.completedAt ? [task.completedAt] : []),
  );
}

function getSignedTransactionAmount(transaction: TimelineTransaction) {
  return transaction.type === "credited" ? transaction.amount : -transaction.amount;
}

function getUniqueSortedDates(dates: string[]) {
  return [...new Set(dates)].sort();
}

function isLinkedToGoal(
  item: { goalId?: string; tags: string[] },
  goal: TimelineGoal,
) {
  return item.goalId === goal.id || item.tags.includes(goal.linkedTag);
}

function sortByCreatedAt<TItem extends { createdAt: string }>(left: TItem, right: TItem) {
  return left.createdAt.localeCompare(right.createdAt);
}

function sortGoalSnapshots(left: GoalSnapshot, right: GoalSnapshot) {
  if (left.isActiveOnDate !== right.isActiveOnDate) {
    return left.isActiveOnDate ? -1 : 1;
  }

  return left.goal.targetDate.localeCompare(right.goal.targetDate);
}
