import type { AnchorCard } from "../../shared/types/cards";

export function getCardProgress(card: AnchorCard) {
  if (card.type === "goal") {
    const totalTasks = card.content.tasks?.length ?? 0;
    const completedTasks = card.content.tasks?.filter((task) => task.completed).length ?? 0;

    if (totalTasks === 0) {
      return card.content.progress ?? 0;
    }

    return Math.round((completedTasks / totalTasks) * 100);
  }

  if (card.type === "checklist") {
    const totalTasks = card.content.tasks.length;
    const completedTasks = card.content.tasks.filter((task) => task.completed).length;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  }

  if (card.type === "progress") {
    return Math.min(100, Math.round((card.content.currentValue / card.content.targetValue) * 100));
  }

  return 0;
}

export function getHabitStreak(card: AnchorCard) {
  if (card.type !== "habit") {
    return 0;
  }

  return [...card.content.logs].reverse().reduce((streak, log) => {
    if (!log.completed) {
      return streak;
    }

    return streak + 1;
  }, 0);
}

export function getMonthlyExpenseTotal(cards: AnchorCard[]) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  return cards
    .filter(
      (card) =>
        card.type === "expense" &&
        card.content.date.startsWith(currentMonth) &&
        getExpenseTransactionType(card) === "spent",
    )
    .reduce((total, card) => total + (card.type === "expense" ? card.content.amount : 0), 0);
}

export function getExpenseTransactionType(card: AnchorCard) {
  if (card.type !== "expense") {
    return "spent";
  }

  return card.content.transactionType ?? "spent";
}
