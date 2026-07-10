import { z } from "zod";

import { cardSchema } from "./cardSchemas";
import { spaceSchema } from "./spaceSchemas";
import { timelineDataSchema } from "./timelineSchemas";

export const backupSchema = z.object({
  version: z.literal(2),
  exportedAt: z.string(),
  spaces: z.array(spaceSchema),
  cards: z.array(cardSchema),
  timeline: timelineDataSchema,
});
