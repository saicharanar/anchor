import Dexie, { type Table } from "dexie";

import type { AnchorCard } from "../shared/types/cards";
import type { Space } from "../shared/types/spaces";

export class AnchorDatabase extends Dexie {
  spaces!: Table<Space, string>;
  cards!: Table<AnchorCard, string>;

  constructor() {
    super("anchor_local_workspace");

    this.version(1).stores({
      spaces: "id, updatedAt, name",
      cards: "id, spaceId, type, updatedAt",
    });
  }
}

export const anchorDatabase = new AnchorDatabase();
