import { Check, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAnchorStore } from "../../app/useAnchorStore";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { getCardTypeMeta } from "../../shared/constants/cardTypes";
import type { AnchorCard, ChecklistItem } from "../../shared/types/cards";
import { formatShortDate } from "../../shared/utils/dates";
import { CardFormDialog } from "./CardFormDialog";
import { getCardProgress, getExpenseTransactionType, getHabitStreak } from "./cardMetrics";
import { addGoalTask, getGoalTasks, toggleGoalTask } from "./goalTasks";
import { addChecklistTask, sortTasksForDisplay, toggleChecklistTask } from "./taskMutations";

type CardGridProps = {
  cards: AnchorCard[];
  spaceId: string;
};

type GoalCard = Extract<AnchorCard, { type: "goal" }>;
type ChecklistCard = Extract<AnchorCard, { type: "checklist" }>;

export function CardGrid({ cards, spaceId }: CardGridProps) {
  const groupedItems = useMemo(() => getGroupedItems(cards), [cards]);

  return (
    <div className="space-y-4">
      {groupedItems.primaryItems.map((card) => (
        <PlanningItem key={card.id} card={card} spaceId={spaceId} />
      ))}

      {groupedItems.otherItems.length > 0 ? (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-anchor-muted">Other</h2>
          <div className="liquid-panel overflow-hidden p-1.5">
            {groupedItems.otherItems.map((card) => (
              <CompactItemRow key={card.id} card={card} spaceId={spaceId} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function getGroupedItems(cards: AnchorCard[]) {
  return {
    primaryItems: cards.filter((card) => card.type === "goal" || card.type === "checklist"),
    otherItems: cards.filter((card) => card.type !== "goal" && card.type !== "checklist"),
  };
}

function PlanningItem({ card, spaceId }: { card: AnchorCard; spaceId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const removeCard = useAnchorStore((state) => state.removeCard);
  const meta = getCardTypeMeta(card.type);
  const Icon = meta.icon;

  function deleteItem() {
    const confirmed = window.confirm(`Delete "${card.title}"?`);

    if (!confirmed) {
      return;
    }

    void removeCard(card.id);
  }

  return (
    <section className="content-panel overflow-hidden p-0">
      <div className="planning-item-header">
        <Link
          to={`/spaces/${spaceId}/items/${card.id}`}
          className="planning-item-link"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-white/48 text-anchor-muted">
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-semibold text-anchor-text">{card.title}</span>
            <span className="block text-xs text-anchor-muted">{meta.label}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-anchor-muted/70" />
        </Link>
        <div className="planning-item-actions">
          <button aria-label={`Edit ${card.title}`} onClick={() => setIsEditing(true)} type="button">
            <Pencil className="h-4 w-4" />
          </button>
          <button aria-label={`Delete ${card.title}`} className="text-anchor-danger" onClick={deleteItem} type="button">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <PlanningItemBody card={card} />
      </div>
      <CardFormDialog open={isEditing} onClose={() => setIsEditing(false)} card={card} spaceId={spaceId} />
    </section>
  );
}

function PlanningItemBody({ card }: { card: AnchorCard }) {
  if (card.type === "goal") {
    return <GoalBody card={card} />;
  }

  if (card.type === "checklist") {
    return <ChecklistBody card={card} />;
  }

  return null;
}

function GoalBody({ card }: { card: GoalCard }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const goalTasks = sortTasksForDisplay(getGoalTasks(card));
  const completedTaskCount = goalTasks.filter((task) => task.completed).length;
  const progress = getCardProgress(card);

  function toggleMilestone(taskId: string) {
    void upsertCard(toggleGoalTask(card, taskId));
  }

  return (
    <div className="space-y-3">
      {card.content.description ? (
        <p className="text-sm leading-6 text-anchor-muted">{card.content.description}</p>
      ) : null}

      {goalTasks.length > 0 ? (
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-xs text-anchor-muted">
            <span>{completedTaskCount} of {goalTasks.length} done</span>
            <span>{formatShortDate(card.content.targetDate)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-anchor-muted">Add tasks to calculate progress.</p>
      )}

      <TaskList tasks={goalTasks} onToggle={toggleMilestone} />
      <InlineTaskComposer onAdd={(label) => void upsertCard(addGoalTask(card, label))} />
    </div>
  );
}

function ChecklistBody({ card }: { card: ChecklistCard }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const checklistTasks = sortTasksForDisplay(card.content.tasks);
  const completedTaskCount = checklistTasks.filter((task) => task.completed).length;

  function toggleTask(taskId: string) {
    void upsertCard(toggleChecklistTask(card, taskId));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Progress value={getCardProgress(card)} />
        <p className="text-xs text-anchor-muted">{completedTaskCount} of {checklistTasks.length} done</p>
      </div>
      <TaskList tasks={checklistTasks} onToggle={toggleTask} />
      <InlineTaskComposer onAdd={(label) => void upsertCard(addChecklistTask(card, label))} />
    </div>
  );
}

function TaskList({ tasks, onToggle }: { tasks: ChecklistItem[]; onToggle: (taskId: string) => void }) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1.5">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            className="task-row"
            onClick={() => onToggle(task.id)}
            type="button"
          >
            <span className={task.completed ? "task-check task-check-complete" : "task-check"}>
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className={task.completed ? "truncate text-anchor-muted line-through" : "truncate text-anchor-text"}>
              {task.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function InlineTaskComposer({ onAdd }: { onAdd: (label: string) => void }) {
  const [isComposing, setIsComposing] = useState(false);
  const [taskLabel, setTaskLabel] = useState("");

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTaskLabel = taskLabel.trim();

    if (!trimmedTaskLabel) {
      setIsComposing(true);
      return;
    }

    onAdd(trimmedTaskLabel);
    setTaskLabel("");
  }

  if (!isComposing) {
    return (
      <button className="add-task-row" onClick={() => setIsComposing(true)} type="button">
        <Plus className="h-4 w-4" />
        <span>Add task</span>
      </button>
    );
  }

  return (
    <form className="flex items-center gap-2" onSubmit={submitTask}>
      <Input
        autoFocus
        className="min-h-12"
        placeholder="Add a task"
        value={taskLabel}
        onChange={(event) => setTaskLabel(event.target.value)}
      />
      <Button aria-label="Add task" className="h-12 w-12 shrink-0 px-0" type="submit">
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}

function CompactItemRow({ card, spaceId }: { card: AnchorCard; spaceId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const meta = getCardTypeMeta(card.type);
  const Icon = meta.icon;
  const detail = getCompactDetail(card);

  return (
    <>
      <button className="flex min-h-14 w-full items-center gap-3 rounded-[22px] px-3 py-2 text-left" onClick={() => setIsEditing(true)} type="button">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] bg-white/42 text-anchor-muted">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-anchor-text">{card.title}</span>
          <span className="block truncate text-xs text-anchor-muted">{detail}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-anchor-muted/70" />
      </button>
      <CardFormDialog open={isEditing} onClose={() => setIsEditing(false)} card={card} spaceId={spaceId} />
    </>
  );
}

function getCompactDetail(card: AnchorCard) {
  if (card.type === "habit") {
    return `${getHabitStreak(card)} streak entries`;
  }

  if (card.type === "expense") {
    const transactionType = getExpenseTransactionType(card);
    const prefix = transactionType === "credited" ? "+" : "-";
    return `${prefix}$${card.content.amount.toFixed(0)} · ${formatShortDate(card.content.date)}`;
  }

  if (card.type === "progress") {
    return `${getCardProgress(card)}% complete`;
  }

  if (card.type === "note") {
    return card.content.content || "Note";
  }

  return getCardTypeMeta(card.type).label;
}
