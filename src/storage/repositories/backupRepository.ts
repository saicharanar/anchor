import { backupSchema } from "../../shared/schemas/backupSchemas";
import type { AnchorBackup } from "../../shared/types/backup";
import { anchorDatabase } from "../db";

export async function createBackup(): Promise<AnchorBackup> {
  const [spaces, cards] = await Promise.all([
    anchorDatabase.spaces.toArray(),
    anchorDatabase.cards.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    spaces,
    cards,
  };
}

export async function restoreBackup(rawBackup: unknown) {
  const backup = backupSchema.parse(rawBackup);

  await anchorDatabase.transaction("rw", anchorDatabase.spaces, anchorDatabase.cards, async () => {
    await anchorDatabase.cards.clear();
    await anchorDatabase.spaces.clear();
    await anchorDatabase.spaces.bulkPut(backup.spaces);
    await anchorDatabase.cards.bulkPut(backup.cards);
  });

  return backup;
}

export async function clearLocalWorkspace() {
  await anchorDatabase.transaction("rw", anchorDatabase.spaces, anchorDatabase.cards, async () => {
    await anchorDatabase.cards.clear();
    await anchorDatabase.spaces.clear();
  });
}
