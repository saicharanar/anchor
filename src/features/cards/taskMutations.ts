import type { AnchorCard, ChecklistItem } from "../../shared/types/cards";
import { createId } from "../../shared/utils/id";
import { getGoalTasks } from "./goalTasks";

type GoalCard = Extract<AnchorCard, { type: "goal" }>;
type ChecklistCard = Extract<AnchorCard, { type: "checklist" }>;

export function sortTasksForDisplay(tasks: ChecklistItem[]) {
  return [...tasks].sort((leftTask, rightTask) => Number(leftTask.completed) - Number(rightTask.completed));
}

export function addChecklistTask(card: ChecklistCard, label: string): ChecklistCard {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return card;
  }

  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      tasks: [
        ...card.content.tasks,
        {
          id: createId("task"),
          label: trimmedLabel,
          completed: false,
        },
      ],
    },
  };
}

export function toggleChecklistTask(card: ChecklistCard, taskId: string): ChecklistCard {
  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      tasks: card.content.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    },
  };
}

export function updateGoalTaskLabel(card: GoalCard, taskId: string, label: string): GoalCard {
  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      ...card.content,
      tasks: getGoalTasks(card).map((task) => (task.id === taskId ? { ...task, label } : task)),
    },
  };
}

export function removeGoalTask(card: GoalCard, taskId: string): GoalCard {
  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      ...card.content,
      tasks: getGoalTasks(card).filter((task) => task.id !== taskId),
    },
  };
}

export function updateChecklistTaskLabel(card: ChecklistCard, taskId: string, label: string): ChecklistCard {
  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      tasks: card.content.tasks.map((task) => (task.id === taskId ? { ...task, label } : task)),
    },
  };
}

export function removeChecklistTask(card: ChecklistCard, taskId: string): ChecklistCard {
  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      tasks: card.content.tasks.filter((task) => task.id !== taskId),
    },
  };
}
