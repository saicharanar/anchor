import { backupSchema } from "../../shared/schemas/backupSchemas";
import type { AnchorBackup } from "../../shared/types/backup";
import { anchorDatabase } from "../db";

export async function createBackup(): Promise<AnchorBackup> {
  const [spaces, cards, goals, tasks, habits, habitLogs, transactions] = await Promise.all([
    anchorDatabase.spaces.toArray(),
    anchorDatabase.cards.toArray(),
    anchorDatabase.goals.toArray(),
    anchorDatabase.tasks.toArray(),
    anchorDatabase.habits.toArray(),
    anchorDatabase.habitLogs.toArray(),
    anchorDatabase.transactions.toArray(),
  ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    spaces,
    cards,
    timeline: { goals, tasks, habits, habitLogs, transactions },
  };
}

export async function restoreBackup(rawBackup: unknown) {
  const backup = backupSchema.parse(rawBackup);

  await anchorDatabase.transaction(
    "rw",
    [
      anchorDatabase.spaces,
      anchorDatabase.cards,
      anchorDatabase.goals,
      anchorDatabase.tasks,
      anchorDatabase.habits,
      anchorDatabase.habitLogs,
      anchorDatabase.transactions,
    ],
    async () => {
      await anchorDatabase.cards.clear();
      await anchorDatabase.spaces.clear();
      await anchorDatabase.goals.clear();
      await anchorDatabase.tasks.clear();
      await anchorDatabase.habits.clear();
      await anchorDatabase.habitLogs.clear();
      await anchorDatabase.transactions.clear();
      await anchorDatabase.spaces.bulkPut(backup.spaces);
      await anchorDatabase.cards.bulkPut(backup.cards);
      await anchorDatabase.goals.bulkPut(backup.timeline.goals);
      await anchorDatabase.tasks.bulkPut(backup.timeline.tasks);
      await anchorDatabase.habits.bulkPut(backup.timeline.habits);
      await anchorDatabase.habitLogs.bulkPut(backup.timeline.habitLogs);
      await anchorDatabase.transactions.bulkPut(backup.timeline.transactions);
    },
  );

  return backup;
}

export async function clearLocalWorkspace() {
  await anchorDatabase.transaction(
    "rw",
    [
      anchorDatabase.spaces,
      anchorDatabase.cards,
      anchorDatabase.goals,
      anchorDatabase.tasks,
      anchorDatabase.habits,
      anchorDatabase.habitLogs,
      anchorDatabase.transactions,
    ],
    async () => {
      await anchorDatabase.cards.clear();
      await anchorDatabase.spaces.clear();
      await anchorDatabase.goals.clear();
      await anchorDatabase.tasks.clear();
      await anchorDatabase.habits.clear();
      await anchorDatabase.habitLogs.clear();
      await anchorDatabase.transactions.clear();
    },
  );
}
