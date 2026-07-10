import { create } from "zustand";

import { createBackup, restoreBackup, clearLocalWorkspace } from "../storage/repositories/backupRepository";
import { deleteCard, getAllCards, saveCard } from "../storage/repositories/cardsRepository";
import {
  deleteSpaceWithCards,
  getAllSpaces,
  saveSpace,
} from "../storage/repositories/spacesRepository";
import { getMissingDefaultSpaces } from "../features/spaces/defaultSpaces";
import {
  clearTimelineData,
  deleteTimelineGoal,
  deleteTimelineHabit,
  deleteTimelineTask,
  deleteTimelineTransaction,
  getTimelineData,
  saveTimelineGoal,
  saveTimelineHabit,
  saveTimelineHabitLog,
  saveTimelineTask,
  saveTimelineTransaction,
} from "../storage/repositories/timelineRepository";
import type { AnchorCard } from "../shared/types/cards";
import type { Space } from "../shared/types/spaces";
import type {
  TimelineData,
  TimelineGoal,
  TimelineHabit,
  TimelineHabitLog,
  TimelineTask,
  TimelineTransaction,
} from "../shared/types/timeline";

type AnchorStoreState = {
  spaces: Space[];
  cards: AnchorCard[];
  timeline: TimelineData;
  isLoading: boolean;
  error: string | null;
  loadWorkspace: () => Promise<void>;
  upsertSpace: (space: Space) => Promise<void>;
  removeSpace: (spaceId: string) => Promise<void>;
  upsertCard: (card: AnchorCard) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  upsertGoal: (goal: TimelineGoal) => Promise<void>;
  upsertTask: (task: TimelineTask) => Promise<void>;
  upsertHabit: (habit: TimelineHabit) => Promise<void>;
  upsertHabitLog: (log: TimelineHabitLog) => Promise<void>;
  upsertTransaction: (transaction: TimelineTransaction) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  removeTransaction: (transactionId: string) => Promise<void>;
  exportWorkspace: () => Promise<string>;
  importWorkspace: (backup: unknown) => Promise<void>;
  clearWorkspace: () => Promise<void>;
};

export const useAnchorStore = create<AnchorStoreState>((set, get) => ({
  spaces: [],
  cards: [],
  timeline: { goals: [], tasks: [], habits: [], habitLogs: [], transactions: [] },
  isLoading: true,
  error: null,

  loadWorkspace: async () => {
    set({ isLoading: true, error: null });

    try {
      const [storedSpaces, cards, timeline] = await Promise.all([getAllSpaces(), getAllCards(), getTimelineData()]);
      const missingDefaultSpaces = getMissingDefaultSpaces(storedSpaces);

      await Promise.all(missingDefaultSpaces.map(saveSpace));

      set({ spaces: [...missingDefaultSpaces, ...storedSpaces], cards, timeline, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  upsertSpace: async (space) => {
    await saveSpace(space);
    const existingSpaces = get().spaces.filter((item) => item.id !== space.id);
    set({ spaces: [space, ...existingSpaces] });
  },

  removeSpace: async (spaceId) => {
    await deleteSpaceWithCards(spaceId);
    set({
      spaces: get().spaces.filter((space) => space.id !== spaceId),
      cards: get().cards.filter((card) => card.spaceId !== spaceId),
    });
  },

  upsertCard: async (card) => {
    await saveCard(card);
    const existingCards = get().cards.filter((item) => item.id !== card.id);
    set({ cards: [card, ...existingCards] });
  },

  removeCard: async (cardId) => {
    await deleteCard(cardId);
    set({ cards: get().cards.filter((card) => card.id !== cardId) });
  },

  upsertGoal: async (goal) => {
    await saveTimelineGoal(goal);
    set({ timeline: upsertTimelineItem(get().timeline, "goals", goal) });
  },

  upsertTask: async (task) => {
    await saveTimelineTask(task);
    set({ timeline: upsertTimelineItem(get().timeline, "tasks", task) });
  },

  upsertHabit: async (habit) => {
    await saveTimelineHabit(habit);
    set({ timeline: upsertTimelineItem(get().timeline, "habits", habit) });
  },

  upsertHabitLog: async (log) => {
    await saveTimelineHabitLog(log);
    set({ timeline: upsertTimelineItem(get().timeline, "habitLogs", log) });
  },

  upsertTransaction: async (transaction) => {
    await saveTimelineTransaction(transaction);
    set({ timeline: upsertTimelineItem(get().timeline, "transactions", transaction) });
  },

  removeGoal: async (goalId) => {
    await deleteTimelineGoal(goalId);
    const timeline = get().timeline;
    set({
      timeline: {
        ...timeline,
        goals: timeline.goals.filter((goal) => goal.id !== goalId),
        tasks: timeline.tasks.filter((task) => task.goalId !== goalId),
      },
    });
  },

  removeTask: async (taskId) => {
    await deleteTimelineTask(taskId);
    const timeline = get().timeline;
    set({ timeline: { ...timeline, tasks: timeline.tasks.filter((task) => task.id !== taskId) } });
  },

  removeHabit: async (habitId) => {
    await deleteTimelineHabit(habitId);
    const timeline = get().timeline;
    set({
      timeline: {
        ...timeline,
        habits: timeline.habits.filter((habit) => habit.id !== habitId),
        habitLogs: timeline.habitLogs.filter((log) => log.habitId !== habitId),
      },
    });
  },

  removeTransaction: async (transactionId) => {
    await deleteTimelineTransaction(transactionId);
    const timeline = get().timeline;
    set({
      timeline: {
        ...timeline,
        transactions: timeline.transactions.filter((transaction) => transaction.id !== transactionId),
      },
    });
  },

  exportWorkspace: async () => {
    const backup = await createBackup();
    return JSON.stringify(backup, null, 2);
  },

  importWorkspace: async (backup) => {
    await restoreBackup(backup);
    await get().loadWorkspace();
  },

  clearWorkspace: async () => {
    await clearLocalWorkspace();
    await clearTimelineData();
    set({ spaces: [], cards: [], timeline: { goals: [], tasks: [], habits: [], habitLogs: [], transactions: [] } });
  },
}));

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function upsertTimelineItem<TKey extends keyof TimelineData>(
  timeline: TimelineData,
  key: TKey,
  item: TimelineData[TKey][number],
) {
  return {
    ...timeline,
    [key]: [item, ...timeline[key].filter((currentItem) => currentItem.id !== item.id)],
  };
}
