import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { Button } from "../../components/ui/button";
import { Input, Textarea } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Progress } from "../../components/ui/progress";
import type { AnchorCard, ChecklistItem, GoalStatus } from "../../shared/types/cards";
import { cn } from "../../shared/utils/cn";
import { formatShortDate } from "../../shared/utils/dates";
import { getCardProgress } from "../../features/cards/cardMetrics";
import { addGoalTask, getGoalTasks, toggleGoalTask } from "../../features/cards/goalTasks";
import {
  addChecklistTask,
  removeChecklistTask,
  removeGoalTask,
  sortTasksForDisplay,
  toggleChecklistTask,
  updateChecklistTaskLabel,
  updateGoalTaskLabel,
} from "../../features/cards/taskMutations";

type GoalCard = Extract<AnchorCard, { type: "goal" }>;
type ChecklistCard = Extract<AnchorCard, { type: "checklist" }>;
type DetailCard = GoalCard | ChecklistCard;

type DetailDraft = {
  title: string;
  description: string;
  targetDate: string;
  status: GoalStatus;
};

export function CardDetailRoute() {
  const { spaceId, cardId } = useParams();
  const { spaces, cards } = useAnchorStore();
  const space = spaces.find((item) => item.id === spaceId);
  const card = cards.find((item) => item.id === cardId);

  if (!spaceId || !space || !card) {
    return <Navigate to="/" replace />;
  }

  if (card.type !== "goal" && card.type !== "checklist") {
    return <Navigate to={`/spaces/${spaceId}`} replace />;
  }

  return <ItemDetail card={card} spaceName={space.name} />;
}

function ItemDetail({ card, spaceName }: { card: DetailCard; spaceName: string }) {
  const navigate = useNavigate();
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const tasks = useMemo(() => getSortedCardTasks(card), [card]);
  const completedTaskCount = tasks.filter((task) => task.completed).length;
  const progress = getCardProgress(card);
  const subtitle = card.type === "goal" ? card.content.description : "";
  const dueDate = card.type === "goal" ? card.content.targetDate : "";

  return (
    <div className="item-detail mx-auto max-w-xl">
      <div className="item-nav">
        <button className="item-nav-button" onClick={() => navigate(`/spaces/${card.spaceId}`)} type="button">
          <ArrowLeft className="h-4 w-4" />
          <span>{spaceName}</span>
        </button>
        <button
          aria-label="Item options"
          className="liquid-icon-button h-9 w-9"
          onClick={() => setIsActionsOpen(true)}
          type="button"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <header className="item-title-block">
        <p className="item-eyebrow">{card.type === "goal" ? "Goal" : "Checklist"}</p>
        <h1>{card.title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      <section className="ios-group">
        <div className="item-progress">
          <Progress value={progress} />
          <div>
            <span>{completedTaskCount} of {tasks.length} done</span>
            {dueDate ? <span>{formatShortDate(dueDate)}</span> : null}
          </div>
        </div>

        <TaskList card={card} isEditing={isEditingTasks} tasks={tasks} />
        <InlineTaskComposer card={card} />
      </section>

      <div className="item-secondary-actions">
        <button onClick={() => setIsEditingTasks((currentValue) => !currentValue)} type="button">
          <Pencil className="h-4 w-4" />
          <span>{isEditingTasks ? "Done editing" : "Edit tasks"}</span>
        </button>
      </div>

      {isActionsOpen ? <ItemActionsSheet card={card} onClose={() => setIsActionsOpen(false)} /> : null}
    </div>
  );
}

function getSortedCardTasks(card: DetailCard) {
  if (card.type === "goal") {
    return sortTasksForDisplay(getGoalTasks(card));
  }

  return sortTasksForDisplay(card.content.tasks);
}

function TaskList({ card, isEditing, tasks }: { card: DetailCard; isEditing: boolean; tasks: ChecklistItem[] }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);

  function toggleTask(taskId: string) {
    const updatedCard = card.type === "goal" ? toggleGoalTask(card, taskId) : toggleChecklistTask(card, taskId);
    void upsertCard(updatedCard);
  }

  function renameTask(taskId: string, label: string) {
    const updatedCard = card.type === "goal" ? updateGoalTaskLabel(card, taskId, label) : updateChecklistTaskLabel(card, taskId, label);
    void upsertCard(updatedCard);
  }

  function deleteTask(taskId: string) {
    const updatedCard = card.type === "goal" ? removeGoalTask(card, taskId) : removeChecklistTask(card, taskId);
    void upsertCard(updatedCard);
  }

  if (tasks.length === 0) {
    return <p className="ios-empty-row">Add the first task below.</p>;
  }

  return (
    <ul className="ios-task-list">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          isEditing={isEditing}
          onDelete={() => deleteTask(task.id)}
          onRename={(label) => renameTask(task.id, label)}
          onToggle={() => toggleTask(task.id)}
          task={task}
        />
      ))}
    </ul>
  );
}

function TaskRow({
  isEditing,
  onDelete,
  onRename,
  onToggle,
  task,
}: {
  isEditing: boolean;
  onDelete: () => void;
  onRename: (label: string) => void;
  onToggle: () => void;
  task: ChecklistItem;
}) {
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  function startSwipe(clientX: number) {
    if (isEditing) {
      return;
    }

    setStartX(clientX);
    setDragOffset(0);
  }

  function moveSwipe(clientX: number) {
    if (startX === null) {
      return;
    }

    setDragOffset(Math.min(0, clientX - startX));
  }

  function finishSwipe() {
    if (dragOffset < -72) {
      onDelete();
    }

    setStartX(null);
    setDragOffset(0);
  }

  if (!isEditing) {
    return (
      <li>
        <button
          aria-label={task.completed ? `Mark ${task.label} incomplete` : `Mark ${task.label} complete`}
          className="ios-task-row touch-pan-y"
          onClick={onToggle}
          onPointerCancel={finishSwipe}
          onPointerDown={(event) => startSwipe(event.clientX)}
          onPointerMove={(event) => moveSwipe(event.clientX)}
          onPointerUp={finishSwipe}
          style={{ transform: dragOffset < 0 ? `translateX(${Math.max(dragOffset, -84)}px)` : undefined }}
          type="button"
        >
          <span className={cn("ios-check", task.completed && "ios-check-complete")}>
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="ios-task-label">
            <span className={task.completed ? "line-through text-anchor-muted" : undefined}>{task.label}</span>
          </span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <div className="ios-task-row">
        <button
          aria-label={task.completed ? `Mark ${task.label} incomplete` : `Mark ${task.label} complete`}
          className={cn("ios-check", task.completed && "ios-check-complete")}
          onClick={onToggle}
          type="button"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <input
          aria-label="Task name"
          className="ios-task-input"
          value={task.label}
          onChange={(event) => onRename(event.target.value)}
        />
        <button aria-label={`Delete ${task.label}`} className="ios-delete-task" onClick={onDelete} type="button">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function InlineTaskComposer({ card }: { card: DetailCard }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const [taskLabel, setTaskLabel] = useState("");

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTaskLabel = taskLabel.trim();

    if (!trimmedTaskLabel) {
      return;
    }

    const updatedCard = card.type === "goal" ? addGoalTask(card, trimmedTaskLabel) : addChecklistTask(card, trimmedTaskLabel);
    void upsertCard(updatedCard);
    setTaskLabel("");
  }

  return (
    <form className="ios-add-row" onSubmit={submitTask}>
      <Plus className="h-4 w-4 text-anchor-muted" />
      <input
        aria-label="Add a task"
        placeholder="Add task"
        value={taskLabel}
        onChange={(event) => setTaskLabel(event.target.value)}
      />
      <button aria-label="Add task" disabled={!taskLabel.trim()} type="submit">
        Add
      </button>
    </form>
  );
}

function ItemActionsSheet({ card, onClose }: { card: DetailCard; onClose: () => void }) {
  const navigate = useNavigate();
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const removeCard = useAnchorStore((state) => state.removeCard);
  const [draft, setDraft] = useState<DetailDraft>(() => createDetailDraft(card));

  function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updatedCard = createUpdatedCard(card, draft);
    void upsertCard(updatedCard);
    onClose();
  }

  function deleteItem() {
    void removeCard(card.id);
    navigate(`/spaces/${card.spaceId}`);
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <button aria-label="Close item options" className="sheet-scrim" onClick={onClose} type="button" />
      <section aria-label="Item options" className="ios-sheet">
        <div className="sheet-handle" />
        <div className="sheet-title-row">
          <h2>Item details</h2>
          <button aria-label="Close" className="liquid-icon-button h-9 w-9" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="sheet-form" onSubmit={saveDetails}>
          <label>
            <span>Title</span>
            <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </label>

          {card.type === "goal" ? (
            <>
              <label>
                <span>Notes</span>
                <Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </label>
              <label>
                <span>Target date</span>
                <Input type="date" value={draft.targetDate} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} />
              </label>
              <label>
                <span>Status</span>
                <Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as GoalStatus })}>
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="paused">Paused</option>
                  <option value="complete">Complete</option>
                </Select>
              </label>
            </>
          ) : null}

          <div className="sheet-actions">
            <Button type="submit">Save</Button>
            <Button type="button" variant="ghost" onClick={deleteItem}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function createDetailDraft(card: DetailCard): DetailDraft {
  if (card.type === "checklist") {
    return {
      title: card.title,
      description: "",
      targetDate: new Date().toISOString().slice(0, 10),
      status: "in-progress",
    };
  }

  return {
    title: card.title,
    description: card.content.description,
    targetDate: card.content.targetDate,
    status: card.content.status,
  };
}

function createUpdatedCard(card: DetailCard, draft: DetailDraft): DetailCard {
  if (card.type === "checklist") {
    return {
      ...card,
      title: draft.title.trim() || card.title,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    ...card,
    title: draft.title.trim() || card.title,
    updatedAt: new Date().toISOString(),
    content: {
      ...card.content,
      description: draft.description,
      targetDate: draft.targetDate,
      status: draft.status,
    },
  };
}
