import Dexie, { type Table } from "dexie";

import type { AnchorCard } from "../shared/types/cards";
import type { Space } from "../shared/types/spaces";
import type {
  TimelineGoal,
  TimelineHabit,
  TimelineHabitLog,
  TimelineTask,
  TimelineTransaction,
} from "../shared/types/timeline";

export class AnchorDatabase extends Dexie {
  spaces!: Table<Space, string>;
  cards!: Table<AnchorCard, string>;
  goals!: Table<TimelineGoal, string>;
  tasks!: Table<TimelineTask, string>;
  habits!: Table<TimelineHabit, string>;
  habitLogs!: Table<TimelineHabitLog, string>;
  transactions!: Table<TimelineTransaction, string>;

  constructor() {
    super("anchor_local_workspace");

    this.version(1).stores({
      spaces: "id, updatedAt, name",
      cards: "id, spaceId, type, updatedAt",
    });

    this.version(2).stores({
      spaces: "id, updatedAt, name",
      cards: "id, spaceId, type, updatedAt",
      goals: "id, startDate, targetDate, completedAt, updatedAt, linkedTag",
      tasks: "id, date, completedAt, goalId, updatedAt, *tags",
      habits: "id, startDate, archivedAt, goalId, updatedAt, *tags",
      habitLogs: "id, habitId, date, completed, updatedAt",
      transactions: "id, date, type, goalId, updatedAt, *tags",
    });
  }
}

export const anchorDatabase = new AnchorDatabase();
