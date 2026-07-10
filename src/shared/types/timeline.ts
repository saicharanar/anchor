export type TimelineGoalKind = "money" | "task";

export type TimelineGoal = {
  id: string;
  title: string;
  kind: TimelineGoalKind;
  startDate: string;
  targetDate: string;
  targetAmount?: number;
  linkedTag: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TimelineTask = {
  id: string;
  title: string;
  date: string;
  completedAt?: string;
  goalId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineHabit = {
  id: string;
  title: string;
  startDate: string;
  archivedAt?: string;
  goalId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineHabitLog = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TimelineTransactionType = "spent" | "credited";

export type TimelineTransaction = {
  id: string;
  title: string;
  amount: number;
  type: TimelineTransactionType;
  date: string;
  goalId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TimelineData = {
  goals: TimelineGoal[];
  tasks: TimelineTask[];
  habits: TimelineHabit[];
  habitLogs: TimelineHabitLog[];
  transactions: TimelineTransaction[];
};

export type GoalSnapshot = {
  goal: TimelineGoal;
  progressValue: number;
  progressRatio: number;
  isActiveOnDate: boolean;
  isCompleteAsOfDate: boolean;
  completedAt?: string;
};
