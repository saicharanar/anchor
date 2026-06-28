import type { AnchorCard, ChecklistItem } from "../../shared/types/cards";
import { createId } from "../../shared/utils/id";

export function getGoalTasks(card: AnchorCard): ChecklistItem[] {
  if (card.type !== "goal") {
    return [];
  }

  return card.content.tasks ?? [];
}

export function toggleGoalTask(card: AnchorCard, taskId: string): AnchorCard {
  if (card.type !== "goal") {
    return card;
  }

  const tasks = getGoalTasks(card).map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task,
  );

  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      ...card.content,
      tasks,
    },
  };
}

export function addGoalTask(card: AnchorCard, label: string): AnchorCard {
  if (card.type !== "goal") {
    return card;
  }

  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return card;
  }

  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: {
      ...card.content,
      tasks: [
        ...getGoalTasks(card),
        {
          id: createId("task"),
          label: trimmedLabel,
          completed: false,
        },
      ],
    },
  };
}
