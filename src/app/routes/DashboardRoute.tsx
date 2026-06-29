import { useMemo, useState, type FormEvent } from "react";
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { getExpenseTransactionType } from "../../features/cards/cardMetrics";
import { getMissingDefaultSpaces, isFinanceSpace } from "../../features/spaces/defaultSpaces";
import type { AnchorCard, ChecklistItem } from "../../shared/types/cards";
import type { Space as AnchorSpace } from "../../shared/types/spaces";
import { cn } from "../../shared/utils/cn";
import { getTodayDateInputValue } from "../../shared/utils/dates";
import { createId } from "../../shared/utils/id";

type TrackerMode = "todos" | "habits" | "goals" | "finance";
type TransactionMode = "spent" | "credited";

type TaskEntry = {
  card: Extract<AnchorCard, { type: "goal" | "checklist" }>;
  task: ChecklistItem;
};

const trackerModes: Array<{ id: TrackerMode; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "habits", label: "Habits" },
  { id: "goals", label: "Goals" },
  { id: "finance", label: "Finance" },
];

export function DashboardRoute() {
  const { spaces, cards } = useAnchorStore();
  const [activeMode, setActiveMode] = useState<TrackerMode>("todos");
  const today = new Date();
  const weekdayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(today);
  const monthDayLabel = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long" }).format(today);
  const dateLabel = `${weekdayLabel}, ${monthDayLabel}`;

  return (
    <div className="daily-tracker">
      <header className="daily-header">
        <h1>{dateLabel}</h1>
      </header>

      <div className="daily-mode-control" role="tablist" aria-label="Tracker mode">
        {trackerModes.map((mode) => (
          <button
            key={mode.id}
            aria-selected={activeMode === mode.id}
            className={activeMode === mode.id ? "active" : undefined}
            onClick={() => setActiveMode(mode.id)}
            role="tab"
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>

      {activeMode === "todos" ? <TodosPanel cards={cards} spaces={spaces} /> : null}
      {activeMode === "habits" ? <HabitsPanel cards={cards} spaces={spaces} /> : null}
      {activeMode === "goals" ? <GoalsPanel cards={cards} spaces={spaces} /> : null}
      {activeMode === "finance" ? <FinancePanel cards={cards} spaces={spaces} /> : null}
    </div>
  );
}

function TodosPanel({ cards, spaces }: { cards: AnchorCard[]; spaces: AnchorSpace[] }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const [todoTitle, setTodoTitle] = useState("");
  const tasks = useMemo(() => getTaskEntries(cards), [cards]);

  function submitTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = todoTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const todayCard = getOrCreateTodayChecklist(cards, spaces);
    void upsertCard({
      ...todayCard,
      updatedAt: new Date().toISOString(),
      content: {
        tasks: [
          ...todayCard.content.tasks,
          { id: createId("task"), label: trimmedTitle, completed: false },
        ],
      },
    });
    setTodoTitle("");
  }

  function toggleTask(entry: TaskEntry) {
    const updatedTasks = getTasksForCard(entry.card).map((task) =>
      task.id === entry.task.id ? { ...task, completed: !task.completed } : task,
    );

    void upsertCard(updateTaskCard(entry.card, updatedTasks));
  }

  return (
    <section className="daily-panel">
      <InlineCreateForm
        buttonLabel="Add todo"
        placeholder="New todo..."
        value={todoTitle}
        onChange={setTodoTitle}
        onSubmit={submitTodo}
      />

      <div className="daily-list">
        {tasks.length > 0 ? (
          tasks.map((entry) => (
            <button
              key={`${entry.card.id}-${entry.task.id}`}
              className="daily-row"
              onClick={() => toggleTask(entry)}
              type="button"
            >
              <span className={cn("daily-check", entry.task.completed && "complete")}>
                <Check className="h-4 w-4" />
              </span>
              <span className={entry.task.completed ? "line-through text-anchor-muted" : undefined}>
                {entry.task.label}
              </span>
            </button>
          ))
        ) : (
          <p className="daily-empty">Add the first thing for today.</p>
        )}
      </div>
    </section>
  );
}

function HabitsPanel({ cards, spaces }: { cards: AnchorCard[]; spaces: AnchorSpace[] }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const [habitTitle, setHabitTitle] = useState("");
  const habits = cards.filter((card): card is Extract<AnchorCard, { type: "habit" }> => card.type === "habit");
  const today = getTodayDateInputValue();

  function submitHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = habitTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    void upsertCard({
      id: createId("card"),
      spaceId: getPrimarySpace(spaces).id,
      type: "habit",
      title: trimmedTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: { frequency: "daily", logs: [] },
    });
    setHabitTitle("");
  }

  function toggleHabit(card: Extract<AnchorCard, { type: "habit" }>, date: string) {
    const existingLog = card.content.logs.find((log) => log.date === date);
    const otherLogs = card.content.logs.filter((log) => log.date !== date);
    const nextLog = { date, completed: existingLog ? !existingLog.completed : true };

    void upsertCard({
      ...card,
      updatedAt: new Date().toISOString(),
      content: { ...card.content, logs: [...otherLogs, nextLog].sort((left, right) => left.date.localeCompare(right.date)) },
    });
  }

  return (
    <section className="daily-panel">
      <InlineCreateForm
        buttonLabel="Add habit"
        placeholder="New habit..."
        value={habitTitle}
        onChange={setHabitTitle}
        onSubmit={submitHabit}
      />

      <div className="habit-stack">
        {habits.length > 0 ? (
          habits.map((habit) => (
            <article className="habit-card" key={habit.id}>
              <div className="habit-card-header">
                <h2>{habit.title}</h2>
                <span>{getHabitStreak(habit, today)}d</span>
              </div>
              <div className="habit-week">
                {getRecentDays(today).map((day) => {
                  const isDone = habit.content.logs.some((log) => log.date === day.date && log.completed);

                  return (
                    <button
                      key={day.date}
                      aria-label={`${habit.title} ${day.label}`}
                      className={isDone ? "done" : undefined}
                      onClick={() => toggleHabit(habit, day.date)}
                      type="button"
                    >
                      <span>{day.label}</span>
                      <strong>{isDone ? <Check className="h-4 w-4" /> : null}</strong>
                    </button>
                  );
                })}
              </div>
            </article>
          ))
        ) : (
          <p className="daily-empty">Add a habit and tap today when it is done.</p>
        )}
      </div>
    </section>
  );
}

function GoalsPanel({ cards, spaces }: { cards: AnchorCard[]; spaces: AnchorSpace[] }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDate, setGoalDate] = useState(getTodayDateInputValue());
  const goals = cards.filter((card): card is Extract<AnchorCard, { type: "goal" }> => card.type === "goal");

  function submitGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = goalTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    void upsertCard({
      id: createId("card"),
      spaceId: getPrimarySpace(spaces).id,
      type: "goal",
      title: trimmedTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: { description: "", targetDate: goalDate, status: "in-progress", tasks: [] },
    });
    setGoalTitle("");
    setGoalDate(getTodayDateInputValue());
  }

  return (
    <section className="daily-panel">
      <form className="goal-create-row" onSubmit={submitGoal}>
        <input
          aria-label="New goal"
          placeholder="New goal..."
          value={goalTitle}
          onChange={(event) => setGoalTitle(event.target.value)}
        />
        <input
          aria-label="Target date"
          type="date"
          value={goalDate}
          onChange={(event) => setGoalDate(event.target.value)}
        />
        <button aria-label="Add goal" type="submit">
          <Plus className="h-5 w-5" />
        </button>
      </form>

      <div className="goal-stack">
        {goals.length > 0 ? (
          goals.map((goal) => <GoalTrackerCard key={goal.id} goal={goal} />)
        ) : (
          <p className="daily-empty">Add a goal and break it into trackable tasks.</p>
        )}
      </div>
    </section>
  );
}

function GoalTrackerCard({ goal }: { goal: Extract<AnchorCard, { type: "goal" }> }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const [isOpen, setIsOpen] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const tasks = goal.content.tasks ?? [];
  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  function toggleTask(taskId: string) {
    void upsertCard({
      ...goal,
      updatedAt: new Date().toISOString(),
      content: {
        ...goal.content,
        tasks: tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task),
      },
    });
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = taskTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    void upsertCard({
      ...goal,
      updatedAt: new Date().toISOString(),
      content: {
        ...goal.content,
        tasks: [...tasks, { id: createId("task"), label: trimmedTitle, completed: false }],
      },
    });
    setTaskTitle("");
  }

  return (
    <article className="goal-tracker-card">
      <button className="goal-card-header" onClick={() => setIsOpen((value) => !value)} type="button">
        <span className="goal-ring">{progress}%</span>
        <span>
          <strong>{goal.title}</strong>
          <small>{getDaysLeft(goal.content.targetDate)}</small>
        </span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div className="goal-card-body">
          {tasks.map((task) => (
            <button className="goal-task-row" key={task.id} onClick={() => toggleTask(task.id)} type="button">
              <span className={cn("daily-check", task.completed && "complete")}>
                <Check className="h-4 w-4" />
              </span>
              <span className={task.completed ? "line-through text-anchor-muted" : undefined}>{task.label}</span>
            </button>
          ))}
          <form className="goal-task-create" onSubmit={submitTask}>
            <input
              aria-label={`Add task to ${goal.title}`}
              placeholder="Add task..."
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
            />
            <button aria-label="Add task" type="submit">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function FinancePanel({ cards, spaces }: { cards: AnchorCard[]; spaces: AnchorSpace[] }) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const financeCards = cards.filter((card): card is Extract<AnchorCard, { type: "expense" }> => card.type === "expense");
  const [mode, setMode] = useState<TransactionMode>("spent");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const income = financeCards
    .filter((card) => getExpenseTransactionType(card) === "credited")
    .reduce((total, card) => total + card.content.amount, 0);
  const expenses = financeCards
    .filter((card) => getExpenseTransactionType(card) === "spent")
    .reduce((total, card) => total + card.content.amount, 0);

  function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const trimmedDescription = description.trim();

    if (!trimmedDescription || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    void upsertCard({
      id: createId("card"),
      spaceId: getFinanceSpace(spaces).id,
      type: "expense",
      title: trimmedDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: {
        amount: parsedAmount,
        category: "General",
        date: getTodayDateInputValue(),
        recurring: false,
        transactionType: mode,
      },
    });
    setDescription("");
    setAmount("");
  }

  return (
    <section className="daily-panel finance-panel">
      <div className="balance-card">
        <span>Balance</span>
        <strong>${(income - expenses).toFixed(0)}</strong>
        <div>
          <span>Income <b>${income.toFixed(0)}</b></span>
          <span>Expenses <b>${expenses.toFixed(0)}</b></span>
        </div>
      </div>

      <form className="transaction-create" onSubmit={submitTransaction}>
        <div className="finance-toggle">
          <button className={mode === "spent" ? "active" : undefined} onClick={() => setMode("spent")} type="button">
            Expense
          </button>
          <button className={mode === "credited" ? "active" : undefined} onClick={() => setMode("credited")} type="button">
            Income
          </button>
        </div>
        <input
          aria-label="Transaction description"
          placeholder="Description..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="amount-row">
          <input
            aria-label="Transaction amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <button aria-label="Add transaction" type="submit">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </form>

      <div className="transaction-list">
        {financeCards.slice(0, 8).map((card) => {
          const transactionType = getExpenseTransactionType(card);
          const sign = transactionType === "credited" ? "+" : "-";

          return (
            <div className="transaction-row" key={card.id}>
              <span>
                <strong>{card.title}</strong>
                <small>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(card.content.date))}</small>
              </span>
              <b>{sign}${card.content.amount.toFixed(0)}</b>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InlineCreateForm({
  buttonLabel,
  onChange,
  onSubmit,
  placeholder,
  value,
}: {
  buttonLabel: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <form className="inline-create-row" onSubmit={onSubmit}>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button aria-label={buttonLabel} type="submit">
        <Plus className="h-5 w-5" />
      </button>
    </form>
  );
}

function getTaskEntries(cards: AnchorCard[]): TaskEntry[] {
  return cards.flatMap((card) => {
    if (card.type !== "goal" && card.type !== "checklist") {
      return [];
    }

    return getTasksForCard(card).map((task) => ({ card, task }));
  });
}

function getTasksForCard(card: Extract<AnchorCard, { type: "goal" | "checklist" }>) {
  if (card.type === "goal") {
    return card.content.tasks ?? [];
  }

  return card.content.tasks;
}

function updateTaskCard(
  card: Extract<AnchorCard, { type: "goal" | "checklist" }>,
  tasks: ChecklistItem[],
) {
  if (card.type === "goal") {
    return {
      ...card,
      updatedAt: new Date().toISOString(),
      content: { ...card.content, tasks },
    };
  }

  return {
    ...card,
    updatedAt: new Date().toISOString(),
    content: { tasks },
  };
}

function getOrCreateTodayChecklist(cards: AnchorCard[], spaces: AnchorSpace[]) {
  const existingCard = cards.find(
    (card): card is Extract<AnchorCard, { type: "checklist" }> =>
      card.type === "checklist" && card.title.toLowerCase() === "today",
  );

  if (existingCard) {
    return existingCard;
  }

  return {
    id: createId("card"),
    spaceId: getPrimarySpace(spaces).id,
    type: "checklist",
    title: "Today",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: { tasks: [] },
  } satisfies Extract<AnchorCard, { type: "checklist" }>;
}

function getPrimarySpace(spaces: AnchorSpace[]) {
  const personalSpace = spaces.find((space) => space.name.toLowerCase().includes("personal"));
  const fallbackSpace = spaces[0] ?? getMissingDefaultSpaces([])[0];
  return personalSpace ?? fallbackSpace;
}

function getFinanceSpace(spaces: AnchorSpace[]) {
  const financeSpace = spaces.find(isFinanceSpace);
  const fallbackSpace = spaces[0] ?? getMissingDefaultSpaces([])[1];
  return financeSpace ?? fallbackSpace;
}

function getRecentDays(today: string) {
  const todayDate = new Date(`${today}T00:00:00`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - (6 - index));

    return {
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(date),
    };
  });
}

function getHabitStreak(card: Extract<AnchorCard, { type: "habit" }>, today: string) {
  const completedDates = new Set(card.content.logs.filter((log) => log.completed).map((log) => log.date));
  const cursor = new Date(`${today}T00:00:00`);
  let streak = 0;

  while (completedDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getDaysLeft(targetDate: string) {
  const todayTime = new Date(`${getTodayDateInputValue()}T00:00:00`).getTime();
  const targetTime = new Date(`${targetDate}T00:00:00`).getTime();
  const dayDifference = Math.ceil((targetTime - todayTime) / 86_400_000);

  if (dayDifference < 0) {
    return "overdue";
  }

  if (dayDifference === 0) {
    return "today";
  }

  return `${dayDifference}d left`;
}
