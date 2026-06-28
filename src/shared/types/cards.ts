export type CardType = "goal" | "checklist" | "habit" | "expense" | "progress" | "note";

export type GoalStatus = "not-started" | "in-progress" | "paused" | "complete";

export type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

export type HabitLog = {
  date: string;
  completed: boolean;
};

export type GoalCardContent = {
  description: string;
  targetDate: string;
  progress?: number;
  status: GoalStatus;
  tasks?: ChecklistItem[];
};

export type ChecklistCardContent = {
  tasks: ChecklistItem[];
};

export type HabitCardContent = {
  frequency: "daily" | "weekly";
  logs: HabitLog[];
};

export type ExpenseCardContent = {
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  transactionType: "spent" | "credited";
};

export type ProgressCardContent = {
  currentValue: number;
  targetValue: number;
  unit: string;
};

export type NoteCardContent = {
  content: string;
  tags: string[];
};

export type CardContentByType = {
  goal: GoalCardContent;
  checklist: ChecklistCardContent;
  habit: HabitCardContent;
  expense: ExpenseCardContent;
  progress: ProgressCardContent;
  note: NoteCardContent;
};

export type TypedAnchorCard<TCardType extends CardType> = {
  id: string;
  spaceId: string;
  type: TCardType;
  title: string;
  createdAt: string;
  updatedAt: string;
  content: CardContentByType[TCardType];
};

export type AnchorCard = {
  [TCardType in CardType]: TypedAnchorCard<TCardType>;
}[CardType];
