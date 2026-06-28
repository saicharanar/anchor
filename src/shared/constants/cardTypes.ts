import {
  Banknote,
  CheckSquare,
  FileText,
  Flag,
  Repeat,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { CardType } from "../types/cards";

export type CardTypeMeta = {
  type: CardType;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const CARD_TYPE_META: CardTypeMeta[] = [
  {
    type: "goal",
    label: "Goal",
    description: "Track a target, deadline, and status.",
    icon: Flag,
  },
  {
    type: "checklist",
    label: "Checklist",
    description: "Break a responsibility into tasks.",
    icon: CheckSquare,
  },
  {
    type: "habit",
    label: "Habit",
    description: "Follow a daily or weekly routine.",
    icon: Repeat,
  },
  {
    type: "expense",
    label: "Expense",
    description: "Record a cost or recurring payment.",
    icon: Banknote,
  },
  {
    type: "progress",
    label: "Progress",
    description: "Measure progress toward a number.",
    icon: TrendingUp,
  },
  {
    type: "note",
    label: "Note",
    description: "Keep context, plans, or references.",
    icon: FileText,
  },
];

export function getCardTypeMeta(cardType: CardType) {
  return CARD_TYPE_META.find((meta) => meta.type === cardType) ?? CARD_TYPE_META[0];
}
