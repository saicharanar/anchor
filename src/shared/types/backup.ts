import type { AnchorCard } from "./cards";
import type { Space } from "./spaces";
import type { TimelineData } from "./timeline";

export type AnchorBackup = {
  version: 2;
  exportedAt: string;
  spaces: Space[];
  cards: AnchorCard[];
  timeline: TimelineData;
};
