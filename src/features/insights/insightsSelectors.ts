import type { TimelineData, TimelineGoal, TimelineHabit } from "../../shared/types/timeline";
import { formatDateInputValue } from "../../shared/utils/dates";
import { getGoalSnapshot } from "../timeline/timelineSelectors";

export type InsightsPeriod = "week" | "month" | "all" | "custom";

export type DateRange = {
  start: string;
  end: string;
};

export type MoneyBucketGranularity = "day" | "week" | "month" | "year";

export type MoneyBucket = {
  key: string;
  label: string;
  spent: number;
  credited: number;
};

export type RoutineInsight = {
  habit: TimelineHabit;
  scheduled: number;
  completed: number;
  missed: number;
  ratio: number;
  streak: number;
};

export type RoutineInsights = {
  routines: RoutineInsight[];
  totalScheduled: number;
  totalCompleted: number;
  totalMissed: number;
  completionRatio: number;
  bestStreak: number;
  activeCount: number;
  startedCount: number;
  stoppedCount: number;
};

export type GoalInsights = {
  completed: TimelineGoal[];
  completedCount: number;
  ongoingCount: number;
  overdueCount: number;
};

const DAILY_MAX_SPAN = 14;
const WEEKLY_MAX_SPAN = 92;
const MONTHLY_MAX_SPAN = 731;
const MILLISECONDS_PER_DAY = 86_400_000;
const WEEKDAYS_BEFORE_MONDAY = 6;

export function getPeriodRange(
  period: InsightsPeriod,
  today: string,
  customRange: DateRange,
  timeline: TimelineData,
): DateRange {
  if (period === "custom") {
    return normalizeRange(customRange);
  }

  if (period === "all") {
    return { start: getEarliestRecordDate(timeline, today), end: today };
  }

  if (period === "month") {
    return { start: `${today.slice(0, 7)}-01`, end: today };
  }

  return { start: getMondayOfWeek(today), end: today };
}

export function getMoneyBuckets(transactions: TimelineData["transactions"], range: DateRange): MoneyBucket[] {
  const inRange = transactions.filter((transaction) => isWithinRange(transaction.date, range));
  const buckets = createEmptyBuckets(range);

  inRange.forEach((transaction) => {
    const bucket = buckets.find((candidate) => transaction.date >= candidate.start && transaction.date <= candidate.end);

    if (!bucket) {
      return;
    }

    if (transaction.type === "credited") {
      bucket.credited += transaction.amount;
    } else {
      bucket.spent += transaction.amount;
    }
  });

  return buckets.map(({ key, label, spent, credited }) => ({ key, label, spent, credited }));
}

export function getMoneyTotals(transactions: TimelineData["transactions"], range: DateRange) {
  const inRange = transactions.filter((transaction) => isWithinRange(transaction.date, range));
  const spent = sumByType(inRange, "spent");
  const credited = sumByType(inRange, "credited");

  return { spent, credited, net: credited - spent };
}

export function getRoutineInsights(timeline: TimelineData, range: DateRange, today: string): RoutineInsights {
  const observedEnd = range.end < today ? range.end : today;
  const activeHabits = timeline.habits.filter((habit) => habit.startDate <= range.end);
  const routines = activeHabits
    .map((habit) => getRoutineInsight(habit, timeline, range, observedEnd))
    .sort((left, right) => right.ratio - left.ratio);

  const totalScheduled = sumBy(routines, (routine) => routine.scheduled);
  const totalCompleted = sumBy(routines, (routine) => routine.completed);

  return {
    routines,
    totalScheduled,
    totalCompleted,
    totalMissed: totalScheduled - totalCompleted,
    completionRatio: totalScheduled === 0 ? 0 : totalCompleted / totalScheduled,
    bestStreak: routines.reduce((best, routine) => Math.max(best, routine.streak), 0),
    activeCount: activeHabits.filter((habit) => !habit.archivedAt || habit.archivedAt > range.end).length,
    startedCount: timeline.habits.filter((habit) => isWithinRange(habit.startDate, range)).length,
    stoppedCount: timeline.habits.filter((habit) => Boolean(habit.archivedAt) && isWithinRange(habit.archivedAt as string, range))
      .length,
  };
}

export function getGoalInsights(timeline: TimelineData, range: DateRange): GoalInsights {
  const startedGoals = timeline.goals.filter((goal) => goal.startDate <= range.end);
  const completed: TimelineGoal[] = [];
  let ongoingCount = 0;
  let overdueCount = 0;

  startedGoals.forEach((goal) => {
    const snapshot = getGoalSnapshot(goal, timeline, range.end);
    const completedAt = snapshot.completedAt;

    if (completedAt && completedAt >= range.start && completedAt <= range.end) {
      completed.push(goal);
      return;
    }

    if (snapshot.isCompleteAsOfDate) {
      return;
    }

    if (goal.targetDate >= range.end) {
      ongoingCount += 1;
    } else {
      overdueCount += 1;
    }
  });

  return { completed, completedCount: completed.length, ongoingCount, overdueCount };
}

function getRoutineInsight(
  habit: TimelineHabit,
  timeline: TimelineData,
  range: DateRange,
  observedEnd: string,
): RoutineInsight {
  const windowStart = habit.startDate > range.start ? habit.startDate : range.start;
  const windowEnd = getRoutineWindowEnd(habit, observedEnd);
  const scheduled = windowEnd < windowStart ? 0 : countDaysInclusive(windowStart, windowEnd);
  const completedDates = getCompletedDates(timeline, habit.id);
  const completed = completedDates.filter((date) => date >= windowStart && date <= windowEnd).length;

  return {
    habit,
    scheduled,
    completed,
    missed: Math.max(0, scheduled - completed),
    ratio: scheduled === 0 ? 0 : completed / scheduled,
    streak: getCurrentStreak(completedDates, habit.startDate, windowEnd),
  };
}

function getRoutineWindowEnd(habit: TimelineHabit, observedEnd: string) {
  if (habit.archivedAt && habit.archivedAt <= observedEnd) {
    return getPreviousDate(habit.archivedAt);
  }

  return observedEnd;
}

function getCompletedDates(timeline: TimelineData, habitId: string) {
  return timeline.habitLogs
    .filter((log) => log.habitId === habitId && log.completed)
    .map((log) => log.date);
}

function getCurrentStreak(completedDates: string[], habitStartDate: string, windowEnd: string) {
  const completedSet = new Set(completedDates);
  let streak = 0;
  let cursor = windowEnd;

  while (cursor >= habitStartDate && completedSet.has(cursor)) {
    streak += 1;
    cursor = getPreviousDate(cursor);
  }

  return streak;
}

function createEmptyBuckets(range: DateRange): Array<MoneyBucket & { start: string; end: string }> {
  const granularity = getGranularity(range);

  if (granularity === "day") {
    return getDayStarts(range).map((day) => ({
      key: day,
      label: formatBucketLabel(day, "day"),
      start: day,
      end: day,
      spent: 0,
      credited: 0,
    }));
  }

  if (granularity === "week") {
    return getWeekStarts(range).map((weekStart) => ({
      key: weekStart,
      label: formatBucketLabel(weekStart, "week"),
      start: weekStart,
      end: clampToRangeEnd(getDateAfter(weekStart, WEEKDAYS_BEFORE_MONDAY), range.end),
      spent: 0,
      credited: 0,
    }));
  }

  if (granularity === "month") {
    return getMonthStarts(range).map((monthStart) => ({
      key: monthStart,
      label: formatBucketLabel(monthStart, "month"),
      start: monthStart,
      end: clampToRangeEnd(getLastDayOfMonth(monthStart), range.end),
      spent: 0,
      credited: 0,
    }));
  }

  return getYearStarts(range).map((yearStart) => ({
    key: yearStart,
    label: formatBucketLabel(yearStart, "year"),
    start: yearStart,
    end: clampToRangeEnd(`${yearStart.slice(0, 4)}-12-31`, range.end),
    spent: 0,
    credited: 0,
  }));
}

function getGranularity(range: DateRange): MoneyBucketGranularity {
  const span = countDaysInclusive(range.start, range.end);

  if (span <= DAILY_MAX_SPAN) {
    return "day";
  }

  if (span <= WEEKLY_MAX_SPAN) {
    return "week";
  }

  if (span <= MONTHLY_MAX_SPAN) {
    return "month";
  }

  return "year";
}

function getDayStarts(range: DateRange) {
  const days: string[] = [];
  let cursor = range.start;

  while (cursor <= range.end) {
    days.push(cursor);
    cursor = getDateAfter(cursor, 1);
  }

  return days;
}

function getWeekStarts(range: DateRange) {
  const weeks: string[] = [];
  let cursor = getMondayOfWeek(range.start);

  while (cursor <= range.end) {
    weeks.push(cursor);
    cursor = getDateAfter(cursor, 7);
  }

  return weeks;
}

function getMonthStarts(range: DateRange) {
  const months: string[] = [];
  let cursor = `${range.start.slice(0, 7)}-01`;

  while (cursor <= range.end) {
    months.push(cursor);
    cursor = getFirstDayOfNextMonth(cursor);
  }

  return months;
}

function getYearStarts(range: DateRange) {
  const years: string[] = [];
  let year = Number(range.start.slice(0, 4));
  const lastYear = Number(range.end.slice(0, 4));

  while (year <= lastYear) {
    years.push(`${year}-01-01`);
    year += 1;
  }

  return years;
}

function formatBucketLabel(date: string, granularity: MoneyBucketGranularity) {
  const parsed = new Date(`${date}T00:00:00`);

  if (granularity === "day") {
    return String(parsed.getDate());
  }

  if (granularity === "week") {
    return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(parsed);
  }

  if (granularity === "year") {
    return String(parsed.getFullYear());
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(parsed);
}

function getEarliestRecordDate(timeline: TimelineData, fallback: string) {
  const dates = [
    ...timeline.goals.map((goal) => goal.startDate),
    ...timeline.tasks.map((task) => task.date),
    ...timeline.habits.map((habit) => habit.startDate),
    ...timeline.habitLogs.map((log) => log.date),
    ...timeline.transactions.map((transaction) => transaction.date),
  ];

  return dates.reduce((earliest, date) => (date < earliest ? date : earliest), fallback);
}

function normalizeRange(range: DateRange): DateRange {
  return range.start <= range.end ? range : { start: range.end, end: range.start };
}

function sumByType(transactions: TimelineData["transactions"], type: "spent" | "credited") {
  return transactions.filter((transaction) => transaction.type === type).reduce((total, transaction) => total + transaction.amount, 0);
}

function sumBy<TItem>(items: TItem[], getValue: (item: TItem) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function isWithinRange(date: string, range: DateRange) {
  return date >= range.start && date <= range.end;
}

function clampToRangeEnd(date: string, rangeEnd: string) {
  return date > rangeEnd ? rangeEnd : date;
}

function countDaysInclusive(start: string, end: string) {
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  return Math.round((endTime - startTime) / MILLISECONDS_PER_DAY) + 1;
}

function getMondayOfWeek(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  const mondayOffset = (parsed.getDay() + WEEKDAYS_BEFORE_MONDAY) % 7;
  parsed.setDate(parsed.getDate() - mondayOffset);
  return formatDateInputValue(parsed);
}

function getDateAfter(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return formatDateInputValue(parsed);
}

function getPreviousDate(date: string) {
  return getDateAfter(date, -1);
}

function getLastDayOfMonth(monthStart: string) {
  return getPreviousDate(getFirstDayOfNextMonth(monthStart));
}

function getFirstDayOfNextMonth(monthStart: string) {
  const parsed = new Date(`${monthStart.slice(0, 7)}-01T00:00:00`);
  parsed.setMonth(parsed.getMonth() + 1);
  return formatDateInputValue(parsed);
}
