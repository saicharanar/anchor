import type { AnchorCard } from "../../shared/types/cards";
import type { Space } from "../../shared/types/spaces";
import { isUpcomingDate, sortNewestFirst } from "../../shared/utils/dates";
import { getCardProgress, getExpenseTransactionType, getHabitStreak } from "../cards/cardMetrics";
import { isFinanceSpace } from "../spaces/defaultSpaces";

export type FinanceCalendarDay = {
  date: string;
  dayOfMonth: number;
  weekdayIndex: number;
  spent: number;
  credited: number;
};

export type TodayTask = {
  id: string;
  cardId: string;
  spaceId: string;
  label: string;
  sourceTitle: string;
  sourceType: "goal" | "checklist";
};

export function getDashboardSummary(spaces: Space[], cards: AnchorCard[]) {
  const financeSpaces = spaces.filter(isFinanceSpace);
  const financeSpaceIds = new Set(financeSpaces.map((space) => space.id));
  const financeEntries = cards.filter(
    (card) => card.type === "expense" && financeSpaceIds.has(card.spaceId),
  );
  const activeGoals = cards.filter(
    (card) => card.type === "goal" && card.content.status !== "complete",
  );
  const habitCards = cards.filter((card) => card.type === "habit");
  const upcomingItems = cards.filter(
    (card) => card.type === "goal" && isUpcomingDate(card.content.targetDate),
  );
  const recentCards = sortNewestFirst(cards).slice(0, 6);
  const todayTasks = cards
    .flatMap(getOpenTasksFromCard)
    .slice(0, 6);
  const progressBySpace = getProgressBySpace(spaces, cards);
  const financeCalendarDays = getFinanceCalendarDays(financeEntries);
  const monthlySpent = financeCalendarDays.reduce((total, day) => total + day.spent, 0);
  const monthlyCredited = financeCalendarDays.reduce((total, day) => total + day.credited, 0);

  return {
    spaceCount: spaces.length,
    cardCount: cards.length,
    activeGoals,
    financeSpaces,
    financeEntries,
    financeCalendarDays,
    habitCards,
    monthlyCredited,
    monthlySpent,
    upcomingItems,
    progressBySpace,
    recentCards,
    todayTasks,
    bestHabitStreak: Math.max(0, ...habitCards.map(getHabitStreak)),
  };
}

function getOpenTasksFromCard(card: AnchorCard): TodayTask[] {
  if (card.type === "goal") {
    return (card.content.tasks ?? [])
      .filter((task) => !task.completed)
      .slice(0, 3)
      .map((task) => ({
        id: task.id,
        cardId: card.id,
        spaceId: card.spaceId,
        label: task.label,
        sourceTitle: card.title,
        sourceType: "goal",
      }));
  }

  if (card.type === "checklist") {
    return card.content.tasks
      .filter((task) => !task.completed)
      .slice(0, 3)
      .map((task) => ({
        id: task.id,
        cardId: card.id,
        spaceId: card.spaceId,
        label: task.label,
        sourceTitle: card.title,
        sourceType: "checklist",
      }));
  }

  return [];
}

function getProgressBySpace(spaces: Space[], cards: AnchorCard[]) {
  return spaces.map((space) => {
    const measurableCards = cards.filter(
      (card) =>
        card.spaceId === space.id &&
        (card.type === "goal" || card.type === "progress" || card.type === "checklist"),
    );
    const progressTotal = measurableCards.reduce((total, card) => total + getCardProgress(card), 0);
    const averageProgress =
      measurableCards.length === 0 ? 0 : Math.round(progressTotal / measurableCards.length);

    return {
      space,
      itemCount: cards.filter((card) => card.spaceId === space.id).length,
      progress: averageProgress,
    };
  });
}

function getFinanceCalendarDays(financeEntries: AnchorCard[]): FinanceCalendarDay[] {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [year, month] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dayOfMonth = index + 1;
    const date = `${currentMonth}-${String(dayOfMonth).padStart(2, "0")}`;
    const entriesForDay = financeEntries.filter(
      (card) => card.type === "expense" && card.content.date === date,
    );

    return {
      date,
      dayOfMonth,
      weekdayIndex: new Date(date).getDay(),
      spent: sumFinanceEntries(entriesForDay, "spent"),
      credited: sumFinanceEntries(entriesForDay, "credited"),
    };
  });
}

function sumFinanceEntries(entries: AnchorCard[], transactionType: "spent" | "credited") {
  return entries.reduce((total, card) => {
    if (card.type !== "expense" || getExpenseTransactionType(card) !== transactionType) {
      return total;
    }

    return total + card.content.amount;
  }, 0);
}
