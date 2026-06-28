import type { AnchorCard } from "./cards";
import type { Space } from "./spaces";

export type AnchorBackup = {
  version: 1;
  exportedAt: string;
  spaces: Space[];
  cards: AnchorCard[];
};
