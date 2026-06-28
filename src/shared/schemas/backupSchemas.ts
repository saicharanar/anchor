import { z } from "zod";

import { cardSchema } from "./cardSchemas";
import { spaceSchema } from "./spaceSchemas";

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  spaces: z.array(spaceSchema),
  cards: z.array(cardSchema),
});
