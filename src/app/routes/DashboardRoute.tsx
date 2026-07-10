import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Moon,
  Pencil,
  Sun,
  Target,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import {
  getGoalInsights,
  getMoneyBuckets,
  getMoneyTotals,
  getPeriodRange,
  getRoutineInsights,
  type DateRange,
  type InsightsPeriod,
  type MoneyBucket,
} from "../../features/insights/insightsSelectors";
import {
  formatCompactDate,
  getDateOffset,
  getGoalSnapshots,
  getGoalStatusLine,
  getHabitsForDate,
  getHabitLogForDate,
  getOverdueDayCount,
  getOverdueTasksForDate,
  getRelativeDayLabel,
  getTasksForDate,
  getTransactionsForDate,
} from "../../features/timeline/timelineSelectors";
import type {
  GoalSnapshot,
  TimelineData,
  TimelineGoal,
  TimelineHabit,
} from "../../shared/types/timeline";
import { formatDateInputValue, getTodayDateInputValue } from "../../shared/utils/dates";
import { createId } from "../../shared/utils/id";
import { useAnchorStore } from "../useAnchorStore";

type DailyTab = "today" | "goals" | "money" | "insights";
type MoneyMode = "spent" | "credited";
type ThemeMode = "light" | "dark";

const weekDayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const tabs: Array<{ id: DailyTab; label: string; Icon: typeof CheckCircle2 }> = [
  { id: "today", label: "Today", Icon: CheckCircle2 },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "money", label: "Money", Icon: WalletCards },
  { id: "insights", label: "Insights", Icon: BarChart3 },
];
const insightsPeriods: Array<{ id: InsightsPeriod; label: string }> = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
];
const MAX_AXIS_LABELS = 5;

export function DashboardRoute() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputValue());
  const [activeTab, setActiveTab] = useState<DailyTab>("today");
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const today = getTodayDateInputValue();
  const { timeline } = useAnchorStore();
  const goalSnapshots = useMemo(() => getGoalSnapshots(timeline, selectedDate), [timeline, selectedDate]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("anchor-theme", theme);
  }, [theme]);

  function moveDate(offset: number) {
    setSelectedDate((date) => getDateOffset(date, offset));
  }

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light");
  }

  return (
    <div className="daily-shell">
      {activeTab === "insights" ? (
        <InsightsView onToggleTheme={toggleTheme} theme={theme} today={today} />
      ) : (
        <>
          <AppHeader
            selectedDate={selectedDate}
            theme={theme}
            today={today}
            onDateChange={setSelectedDate}
            onMoveDate={moveDate}
            onToggleTheme={toggleTheme}
          />

          <main className="daily-workspace">
            {activeTab === "today" ? <TodayView goalSnapshots={goalSnapshots} selectedDate={selectedDate} /> : null}
            {activeTab === "goals" ? <GoalsView goalSnapshots={goalSnapshots} selectedDate={selectedDate} /> : null}
            {activeTab === "money" ? <MoneyView goalSnapshots={goalSnapshots} selectedDate={selectedDate} /> : null}
          </main>
        </>
      )}

      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

function AppHeader({
  onDateChange,
  onMoveDate,
  onToggleTheme,
  selectedDate,
  theme,
  today,
}: {
  onDateChange: (date: string) => void;
  onMoveDate: (offset: number) => void;
  onToggleTheme: () => void;
  selectedDate: string;
  theme: ThemeMode;
  today: string;
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <header className="daily-header">
      <div className="daily-brand-row">
        <p className="daily-brand">Anchor</p>
        <button aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} onClick={onToggleTheme} type="button">
          {theme === "light" ? <Moon aria-hidden="true" size={18} strokeWidth={1.75} /> : <Sun aria-hidden="true" size={18} strokeWidth={1.75} />}
        </button>
      </div>
      <div className="daily-title-block">
        <h1>{getRelativeDayLabel(selectedDate, today)}</h1>
        <div className="daily-date-bar">
          <div className="daily-date-info">
            <button className="daily-date-label" onClick={() => setIsCalendarOpen((isOpen) => !isOpen)} type="button">
              {formatReadableDate(selectedDate)}
            </button>
            {selectedDate === today ? null : (
              <button className="daily-today-btn" onClick={() => onDateChange(today)} type="button">
                Today
              </button>
            )}
          </div>
          <div className="daily-date-steps" aria-label="Change date">
            <button aria-label="Previous day" onClick={() => onMoveDate(-1)} type="button">
              ‹
            </button>
            <button aria-label="Next day" onClick={() => onMoveDate(1)} type="button">
              ›
            </button>
          </div>
        </div>
      </div>
      <DateRail selectedDate={selectedDate} onDateChange={onDateChange} />
      {isCalendarOpen ? (
        <CalendarModal onClose={() => setIsCalendarOpen(false)}>
          <MonthPicker
            selectedDate={selectedDate}
            onDateChange={(date) => {
              onDateChange(date);
              setIsCalendarOpen(false);
            }}
          />
        </CalendarModal>
      ) : null}
    </header>
  );
}

function TodayView({ goalSnapshots, selectedDate }: { goalSnapshots: GoalSnapshot[]; selectedDate: string }) {
  const { timeline } = useAnchorStore();
  const tasks = getTasksForDate(timeline.tasks, selectedDate).filter((task) => !task.goalId);
  const overdueTasks = getOverdueTasksForDate(timeline.tasks, selectedDate).filter((task) => !task.goalId);
  const habits = getHabitsForDate(timeline.habits, selectedDate);
  const transactions = getTransactionsForDate(timeline.transactions, selectedDate);
  const activeGoals = goalSnapshots.filter((snapshot) => snapshot.isActiveOnDate);
  const spentToday = sumTransactions(transactions, "spent");

  return (
    <div className="daily-view">
      <section className="daily-quiet-summary" aria-label="Today summary">
        <SummaryLine label="Goals" value={formatGoalSummary(activeGoals)} />
        <SummaryLine label="Money" value={`${formatRupees(spentToday)} spent today`} />
      </section>
      <TasksSection overdueTasks={overdueTasks} selectedDate={selectedDate} tasks={tasks} />
      <RoutinesSection habits={habits} selectedDate={selectedDate} />
    </div>
  );
}

function GoalsView({ goalSnapshots, selectedDate }: { goalSnapshots: GoalSnapshot[]; selectedDate: string }) {
  const { upsertGoal } = useAnchorStore();
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  function addGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const amount = Number(targetAmount);
    const hasMoneyTarget = Number.isFinite(amount) && amount > 0;

    if (!trimmedTitle) {
      return;
    }

    const timestamp = new Date().toISOString();
    void upsertGoal({
      id: createId("goal"),
      title: trimmedTitle,
      kind: hasMoneyTarget ? "money" : "task",
      startDate: selectedDate,
      targetDate: targetDate || selectedDate,
      targetAmount: hasMoneyTarget ? amount : undefined,
      linkedTag: normalizeTag(trimmedTitle),
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    setTitle("");
    setTargetAmount("");
    setTargetDate("");
  }

  return (
    <div className="daily-view">
      <SectionIntro title="Goals" hint="Progress that carries across days." />
      <form className="daily-goal-form" onSubmit={addGoal}>
        <input aria-label="Goal name" placeholder="New goal" value={title} onChange={(event) => setTitle(event.target.value)} />
        <div className="daily-field-row">
          <DateField label="Goal target date" placeholder="Target date" value={targetDate} onChange={setTargetDate} />
          <input
            aria-label="Optional savings target"
            inputMode="decimal"
            placeholder="₹ target, optional"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
          />
        </div>
        <button disabled={!title.trim()} type="submit">
          Add goal
        </button>
      </form>

      <div className="daily-list">
        {goalSnapshots.map((snapshot) => (
          <GoalRow key={snapshot.goal.id} selectedDate={selectedDate} snapshot={snapshot} />
        ))}
        {goalSnapshots.length === 0 ? <EmptyText text="Create one goal worth tracking." /> : null}
      </div>
    </div>
  );
}

function MoneyView({ goalSnapshots, selectedDate }: { goalSnapshots: GoalSnapshot[]; selectedDate: string }) {
  const { timeline } = useAnchorStore();
  const monthTransactions = getTransactionsForMonth(timeline.transactions, selectedDate);
  const monthEntries = [...monthTransactions].sort(
    (left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt),
  );
  const spentThisMonth = sumTransactions(monthTransactions, "spent");
  const creditedThisMonth = sumTransactions(monthTransactions, "credited");

  return (
    <div className="daily-view">
      <SectionIntro title="Money" hint="Spending and credits this month." />
      <section className="daily-money-summary" aria-label="Monthly money summary">
        <p>{formatMonth(selectedDate)}</p>
        <div>
          <span>
            <small>Spent</small>
            <strong>{formatRupees(spentThisMonth)}</strong>
          </span>
          <span>
            <small>Credit</small>
            <strong>{formatRupees(creditedThisMonth)}</strong>
          </span>
        </div>
      </section>
      <TransactionForm goalSnapshots={goalSnapshots} selectedDate={selectedDate} />

      <div className="daily-list">
        {monthEntries.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            moneyGoals={goalSnapshots.map((snapshot) => snapshot.goal)}
            transaction={transaction}
          />
        ))}
        {monthEntries.length === 0 ? <EmptyText text="No money entries this month." /> : null}
      </div>
    </div>
  );
}

function InsightsView({ onToggleTheme, theme, today }: { onToggleTheme: () => void; theme: ThemeMode; today: string }) {
  const { timeline } = useAnchorStore();
  const [period, setPeriod] = useState<InsightsPeriod>("month");
  const [customRange, setCustomRange] = useState<DateRange>(() => ({ start: getDefaultCustomStart(today), end: today }));

  const range = useMemo(() => getPeriodRange(period, today, customRange, timeline), [period, today, customRange, timeline]);
  const money = useMemo(() => getMoneyTotals(timeline.transactions, range), [timeline.transactions, range]);
  const buckets = useMemo(() => getMoneyBuckets(timeline.transactions, range), [timeline.transactions, range]);
  const routines = useMemo(() => getRoutineInsights(timeline, range, today), [timeline, range, today]);
  const goals = useMemo(() => getGoalInsights(timeline, range), [timeline, range]);

  return (
    <div className="daily-insights">
      <div className="daily-brand-row">
        <p className="daily-brand">Anchor</p>
        <button aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`} onClick={onToggleTheme} type="button">
          {theme === "light" ? <Moon aria-hidden="true" size={18} strokeWidth={1.75} /> : <Sun aria-hidden="true" size={18} strokeWidth={1.75} />}
        </button>
      </div>

      <header className="daily-insights-head">
        <h1>Insights</h1>
        <div className="daily-period" role="tablist" aria-label="Insights period">
          {insightsPeriods.map((option) => (
            <button
              aria-selected={period === option.id}
              className={period === option.id ? "active" : undefined}
              key={option.id}
              onClick={() => setPeriod(option.id)}
              role="tab"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        {period === "custom" ? (
          <div className="daily-field-row">
            <DateField
              label="Start date"
              placeholder="Start"
              value={customRange.start}
              onChange={(start) => setCustomRange((current) => ({ ...current, start }))}
            />
            <DateField
              label="End date"
              placeholder="End"
              value={customRange.end}
              onChange={(end) => setCustomRange((current) => ({ ...current, end }))}
            />
          </div>
        ) : null}
        <p className="daily-insights-range">{formatRangeLabel(range)}</p>
      </header>

      <div className="daily-view">
        <section className="daily-section" aria-label="Money insights">
          <SectionIntro title="Money" hint="Credited above the line, spent below." />
          <MoneyChart buckets={buckets} />
          <div className="daily-quiet-summary">
            <SummaryLine label="Spent" value={formatRupees(money.spent)} />
            <SummaryLine label="Credited" value={formatRupees(money.credited)} />
            <SummaryLine label="Net" value={formatRupees(money.net)} />
          </div>
        </section>

        <section className="daily-section" aria-label="Routine insights">
          <SectionIntro
            title="Routines"
            hint={`${Math.round(routines.completionRatio * 100)}% done · ${routines.totalMissed} missed · ${routines.startedCount} started · ${routines.stoppedCount} stopped`}
          />
          {routines.routines.length === 0 ? (
            <EmptyText text="No routines to analyse yet." />
          ) : (
            routines.routines.map((routine) => (
              <div className="daily-routine-insight" key={routine.habit.id}>
                <div className="daily-routine-insight-head">
                  <strong>{routine.habit.title}</strong>
                  <span>
                    {routine.completed}/{routine.scheduled} · {routine.streak}d
                  </span>
                </div>
                <ProgressLine value={routine.ratio} />
              </div>
            ))
          )}
        </section>

        <section className="daily-section" aria-label="Goal insights">
          <SectionIntro title="Goals" hint="Completed, ongoing, and past-target this period." />
          <GoalBar completed={goals.completedCount} ongoing={goals.ongoingCount} overdue={goals.overdueCount} />
          {goals.completed.length > 0 ? (
            <div className="daily-list">
              {goals.completed.map((goal) => (
                <div className="daily-insights-goal" key={goal.id}>
                  <strong>{goal.title}</strong>
                  <span>Completed</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function MoneyChart({ buckets }: { buckets: MoneyBucket[] }) {
  const peak = Math.max(1, ...buckets.map((bucket) => Math.max(bucket.spent, bucket.credited)));
  const axisLabels = pickAxisLabels(buckets, MAX_AXIS_LABELS);

  return (
    <div className="daily-chart">
      <div className="daily-chart-bars">
        {buckets.map((bucket) => (
          <div className="daily-chart-col" key={bucket.key}>
            <span className="daily-chart-up">
              <i className="credited" style={{ blockSize: `${(bucket.credited / peak) * 100}%` }} />
            </span>
            <span className="daily-chart-base" />
            <span className="daily-chart-down">
              <i className="spent" style={{ blockSize: `${(bucket.spent / peak) * 100}%` }} />
            </span>
          </div>
        ))}
      </div>
      {axisLabels.length > 0 ? (
        <div className="daily-chart-axis">
          {axisLabels.map((bucket) => (
            <small key={bucket.key}>{bucket.label}</small>
          ))}
        </div>
      ) : null}
      <div className="daily-chart-legend">
        <span>
          <i className="credited" /> Credited
        </span>
        <span>
          <i className="spent" /> Spent
        </span>
      </div>
    </div>
  );
}

function pickAxisLabels(buckets: MoneyBucket[], max: number) {
  if (buckets.length <= max) {
    return buckets;
  }

  const step = (buckets.length - 1) / (max - 1);
  const indices = Array.from({ length: max }, (_, position) => Math.round(position * step));
  return [...new Set(indices)].map((index) => buckets[index]);
}

function GoalBar({ completed, ongoing, overdue }: { completed: number; ongoing: number; overdue: number }) {
  const total = completed + ongoing + overdue;

  if (total === 0) {
    return <EmptyText text="No goals in this period yet." />;
  }

  return (
    <div className="daily-goalbar">
      <div className="daily-goalbar-track">
        <span className="completed" style={{ inlineSize: `${(completed / total) * 100}%` }} />
        <span className="ongoing" style={{ inlineSize: `${(ongoing / total) * 100}%` }} />
        <span className="overdue" style={{ inlineSize: `${(overdue / total) * 100}%` }} />
      </div>
      <div className="daily-goalbar-legend">
        <span>
          <i className="completed" />
          {completed} completed
        </span>
        <span>
          <i className="ongoing" />
          {ongoing} ongoing
        </span>
        <span>
          <i className="overdue" />
          {overdue} overdue
        </span>
      </div>
    </div>
  );
}

function getDefaultCustomStart(today: string) {
  const start = new Date(`${today}T00:00:00`);
  start.setDate(start.getDate() - 29);
  return formatDateInputValue(start);
}

function formatRangeLabel(range: DateRange) {
  const start = formatReadableDate(range.start);
  const end = formatReadableDate(range.end);
  return start === end ? start : `${start} – ${end}`;
}

function TasksSection({
  overdueTasks,
  selectedDate,
  tasks,
}: {
  overdueTasks: TimelineData["tasks"];
  selectedDate: string;
  tasks: TimelineData["tasks"];
}) {
  const { timeline, removeTask, upsertTask } = useAnchorStore();
  const [title, setTitle] = useState("");

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const timestamp = new Date().toISOString();
    void upsertTask({
      id: createId("task"),
      title: trimmedTitle,
      date: selectedDate,
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setTitle("");
  }

  function toggleTask(taskId: string) {
    const task = timeline.tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    void upsertTask({
      ...task,
      completedAt: task.completedAt ? undefined : selectedDate,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <section className="daily-section" aria-labelledby="tasks-heading">
      <SectionIntro id="tasks-heading" title="Tasks" hint="Things for this date." />
      <InlineTextForm label="New task" placeholder="Add task" value={title} onChange={setTitle} onSubmit={addTask} />
      <div className="daily-list">
        {overdueTasks.map((task) => (
          <EditableCheckRow
            key={task.id}
            isDone={Boolean(task.completedAt)}
            label={task.title}
            meta={formatOverdueLabel(getOverdueDayCount(task.date, selectedDate))}
            onDelete={() => void removeTask(task.id)}
            onRename={(title) => void upsertTask({ ...task, title, updatedAt: new Date().toISOString() })}
            onToggle={() => toggleTask(task.id)}
          />
        ))}
        {tasks.map((task) => (
          <EditableCheckRow
            key={task.id}
            isDone={Boolean(task.completedAt)}
            label={task.title}
            onDelete={() => void removeTask(task.id)}
            onRename={(title) => void upsertTask({ ...task, title, updatedAt: new Date().toISOString() })}
            onToggle={() => toggleTask(task.id)}
          />
        ))}
        {tasks.length === 0 && overdueTasks.length === 0 ? <EmptyText text="No tasks for this date." /> : null}
      </div>
    </section>
  );
}

function RoutinesSection({ habits, selectedDate }: { habits: TimelineHabit[]; selectedDate: string }) {
  const { timeline, removeHabit, upsertHabit, upsertHabitLog } = useAnchorStore();
  const [title, setTitle] = useState("");

  function addHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const timestamp = new Date().toISOString();
    void upsertHabit({
      id: createId("habit"),
      title: trimmedTitle,
      startDate: selectedDate,
      tags: [normalizeTag(trimmedTitle)],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setTitle("");
  }

  function toggleHabit(habitId: string) {
    const existingLog = getHabitLogForDate(timeline.habitLogs, habitId, selectedDate);
    const timestamp = new Date().toISOString();

    void upsertHabitLog({
      id: existingLog?.id ?? createId("habitlog"),
      habitId,
      date: selectedDate,
      completed: existingLog ? !existingLog.completed : true,
      createdAt: existingLog?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  }

  return (
    <section className="daily-section" aria-labelledby="routines-heading">
      <SectionIntro id="routines-heading" title="Routines" hint="Repeatable checks that carry across days." />
      <InlineTextForm label="New routine" placeholder="Add routine" value={title} onChange={setTitle} onSubmit={addHabit} />
      <div className="daily-list">
        {habits.map((habit) => (
          <RoutineRow
            key={habit.id}
            habit={habit}
            isDone={Boolean(getHabitLogForDate(timeline.habitLogs, habit.id, selectedDate)?.completed)}
            onDelete={() => void removeHabit(habit.id)}
            onRename={(title) => void upsertHabit({ ...habit, title, updatedAt: new Date().toISOString() })}
            onToggle={() => toggleHabit(habit.id)}
          />
        ))}
        {habits.length === 0 ? <EmptyText text="No routines yet." /> : null}
      </div>
    </section>
  );
}

function TransactionForm({ goalSnapshots, selectedDate }: { goalSnapshots: GoalSnapshot[]; selectedDate: string }) {
  const { upsertTransaction } = useAnchorStore();
  const [mode, setMode] = useState<MoneyMode>("spent");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [goalId, setGoalId] = useState("");
  const moneyGoals = goalSnapshots.map((snapshot) => snapshot.goal).filter((goal) => goal.kind === "money");

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);
    const trimmedTitle = title.trim();
    const linkedGoal = mode === "credited" ? moneyGoals.find((goal) => goal.id === goalId) : undefined;

    if (!trimmedTitle || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const timestamp = new Date().toISOString();
    void upsertTransaction({
      id: createId("transaction"),
      title: trimmedTitle,
      amount: parsedAmount,
      type: mode,
      date: selectedDate,
      goalId: linkedGoal?.id,
      tags: linkedGoal ? [linkedGoal.linkedTag] : [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    setTitle("");
    setAmount("");
  }

  return (
    <form className="daily-money-form" onSubmit={addTransaction}>
      <div className="daily-mode-toggle" aria-label="Entry type">
        <button
          className={mode === "spent" ? "active" : undefined}
          onClick={() => {
            setMode("spent");
            setGoalId("");
          }}
          type="button"
        >
          Spent
        </button>
        <button className={mode === "credited" ? "active" : undefined} onClick={() => setMode("credited")} type="button">
          Credit
        </button>
      </div>
      <div className="daily-money-fields">
        <input aria-label="Money entry" placeholder="Entry" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input
          aria-label="Amount"
          inputMode="decimal"
          placeholder="₹ amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
      {mode === "credited" && moneyGoals.length > 0 ? (
        <select aria-label="Linked money goal" value={goalId} onChange={(event) => setGoalId(event.target.value)}>
          <option value="">No linked goal</option>
          {moneyGoals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      ) : null}
      <button disabled={!title.trim() || !amount.trim()} type="submit">
        Add entry
      </button>
    </form>
  );
}

function GoalRow({ selectedDate, snapshot }: { selectedDate: string; snapshot: GoalSnapshot }) {
  const { timeline, removeGoal, removeTask, upsertGoal, upsertTask } = useAnchorStore();
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [goalTitle, setGoalTitle] = useState(snapshot.goal.title);
  const [goalTargetDate, setGoalTargetDate] = useState(snapshot.goal.targetDate);
  const [goalTargetAmount, setGoalTargetAmount] = useState(
    snapshot.goal.targetAmount ? String(snapshot.goal.targetAmount) : "",
  );
  const steps = timeline.tasks.filter((task) => task.goalId === snapshot.goal.id);
  const isTaskGoal = snapshot.goal.kind === "task";

  function addStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const timestamp = new Date().toISOString();
    void upsertTask({
      id: createId("task"),
      title: trimmedTitle,
      date: selectedDate,
      goalId: snapshot.goal.id,
      tags: [snapshot.goal.linkedTag],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setTitle("");
  }

  function toggleStep(taskId: string) {
    const step = steps.find((task) => task.id === taskId);

    if (!step) {
      return;
    }

    void upsertTask({
      ...step,
      completedAt: step.completedAt ? undefined : selectedDate,
      updatedAt: new Date().toISOString(),
    });
  }

  function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = goalTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const amount = Number(goalTargetAmount);
    const hasAmount = Number.isFinite(amount) && amount > 0;

    void upsertGoal({
      ...snapshot.goal,
      title: trimmedTitle,
      targetDate: goalTargetDate || snapshot.goal.targetDate,
      targetAmount: isTaskGoal ? snapshot.goal.targetAmount : hasAmount ? amount : snapshot.goal.targetAmount,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  }

  return (
    <article className="daily-goal-row">
      {isEditing ? (
        <form className="daily-goal-edit" onSubmit={saveGoal}>
          <input
            aria-label={`Edit ${snapshot.goal.title}`}
            placeholder="Goal name"
            value={goalTitle}
            onChange={(event) => setGoalTitle(event.target.value)}
          />
          <div className="daily-field-row">
            <DateField label="Goal due date" placeholder="Due date" value={goalTargetDate} onChange={setGoalTargetDate} />
            {isTaskGoal ? null : (
              <input
                aria-label="Target amount"
                inputMode="decimal"
                placeholder="₹ target"
                value={goalTargetAmount}
                onChange={(event) => setGoalTargetAmount(event.target.value)}
              />
            )}
          </div>
          <div className="daily-goal-edit-actions">
            <button onClick={() => setIsEditing(false)} type="button">
              Cancel
            </button>
            <button disabled={!goalTitle.trim()} type="submit">
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="daily-goal-head">
          <span>
            <strong>{snapshot.goal.title}</strong>
            <small>{getGoalStatusLine(snapshot, selectedDate)}</small>
          </span>
          <span className="daily-goal-progress">{formatGoalProgress(snapshot, steps.length)}</span>
          <InlineActions label={snapshot.goal.title} onDelete={() => void removeGoal(snapshot.goal.id)} onEdit={() => setIsEditing(true)} />
        </div>
      )}
      <ProgressLine value={snapshot.progressRatio} />
      {isTaskGoal ? (
        <div className="daily-step-list">
          {steps.map((step) => (
            <EditableCheckRow
              key={step.id}
              isDone={Boolean(step.completedAt)}
              label={step.title}
              onDelete={() => void removeTask(step.id)}
              onRename={(title) => void upsertTask({ ...step, title, updatedAt: new Date().toISOString() })}
              onToggle={() => toggleStep(step.id)}
            />
          ))}
          <InlineTextForm
            label={`New step for ${snapshot.goal.title}`}
            placeholder="Add step"
            value={title}
            onChange={setTitle}
            onSubmit={addStep}
          />
        </div>
      ) : (
        <p className="daily-goal-hint">Add an entry in Money and link it to “{snapshot.goal.title}” to grow this goal.</p>
      )}
    </article>
  );
}

function RoutineRow({
  habit,
  isDone,
  onDelete,
  onRename,
  onToggle,
}: {
  habit: TimelineHabit;
  isDone: boolean;
  onDelete: () => void;
  onRename: (title: string) => void;
  onToggle: () => void;
}) {
  return <EditableCheckRow isDone={isDone} label={habit.title} onDelete={onDelete} onRename={onRename} onToggle={onToggle} />;
}

function TransactionRow({
  moneyGoals,
  transaction,
}: {
  moneyGoals: TimelineGoal[];
  transaction: TimelineData["transactions"][number];
}) {
  const { removeTransaction, upsertTransaction } = useAnchorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));

  function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const parsedAmount = Number(amount);

    if (!trimmedTitle || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    void upsertTransaction({ ...transaction, title: trimmedTitle, amount: parsedAmount, updatedAt: new Date().toISOString() });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form className="daily-edit-form" onSubmit={saveTransaction}>
        <input aria-label={`Edit ${transaction.title}`} value={title} onChange={(event) => setTitle(event.target.value)} />
        <input aria-label={`Edit ${transaction.title} amount`} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <button aria-label="Save entry" type="submit"><Check size={18} strokeWidth={1.75} /></button>
        <button aria-label="Cancel entry edit" onClick={() => setIsEditing(false)} type="button"><X size={18} strokeWidth={1.75} /></button>
      </form>
    );
  }

  return (
    <div className="daily-transaction-row">
      <span>
        <strong>{transaction.title}</strong>
        <small>{getTransactionMeta(transaction, moneyGoals)}</small>
      </span>
      <b>
        {transaction.type === "credited" ? "+" : "-"}
        {formatRupees(transaction.amount)}
      </b>
      <InlineActions label={transaction.title} onDelete={() => void removeTransaction(transaction.id)} onEdit={() => setIsEditing(true)} />
    </div>
  );
}

function DateRail({ onDateChange, selectedDate }: { onDateChange: (date: string) => void; selectedDate: string }) {
  return (
    <section className="daily-date-rail" aria-label="Choose date">
      {getWeekDays(selectedDate).map((day) => (
        <button aria-pressed={day.date === selectedDate} key={day.date} onClick={() => onDateChange(day.date)} type="button">
          <small>{day.weekday}</small>
          <strong>{day.dayOfMonth}</strong>
        </button>
      ))}
    </section>
  );
}

function CalendarModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div aria-label="Choose date" aria-modal="true" className="daily-modal-backdrop" onClick={onClose} role="dialog">
      <div className="daily-modal-body" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function MonthPicker({ onDateChange, selectedDate }: { onDateChange: (date: string) => void; selectedDate: string }) {
  const [visibleMonthDate, setVisibleMonthDate] = useState(`${selectedDate.slice(0, 7)}-01`);
  const days = getMonthPickerDays(visibleMonthDate);

  function moveMonth(offset: number) {
    const nextMonth = new Date(`${visibleMonthDate}T00:00:00`);
    nextMonth.setMonth(nextMonth.getMonth() + offset);
    setVisibleMonthDate(formatDateInputValue(nextMonth));
  }

  return (
    <section className="daily-month-picker" aria-label="Choose day">
      <header>
        <button aria-label="Previous month" onClick={() => moveMonth(-1)} type="button">‹</button>
        <strong>{formatMonth(visibleMonthDate)}</strong>
        <button aria-label="Next month" onClick={() => moveMonth(1)} type="button">›</button>
      </header>
      <div className="daily-month-weekdays" aria-hidden="true">
        {weekDayLabels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
      </div>
      <div className="daily-month-grid">
        {days.map((day) => (
          <button
            aria-pressed={day.date === selectedDate}
            disabled={!day.isCurrentMonth}
            key={day.date}
            onClick={() => onDateChange(day.date)}
            type="button"
          >
            {day.dayOfMonth}
          </button>
        ))}
      </div>
    </section>
  );
}

function DateField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (date: string) => void;
  placeholder: string;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button aria-label={label} className="daily-date-field" onClick={() => setIsOpen(true)} type="button">
        <span className={value ? undefined : "placeholder"}>{value ? formatReadableDate(value) : placeholder}</span>
        <CalendarDays aria-hidden="true" size={16} strokeWidth={1.75} />
      </button>
      {isOpen ? (
        <CalendarModal onClose={() => setIsOpen(false)}>
          <MonthPicker
            selectedDate={value || getTodayDateInputValue()}
            onDateChange={(date) => {
              onChange(date);
              setIsOpen(false);
            }}
          />
        </CalendarModal>
      ) : null}
    </>
  );
}

function BottomTabs({ activeTab, onChange }: { activeTab: DailyTab; onChange: (tab: DailyTab) => void }) {
  return (
    <nav className="daily-bottom-tabs" aria-label="Anchor sections">
      {tabs.map(({ Icon, id, label }) => (
        <button aria-current={activeTab === id ? "page" : undefined} key={id} onClick={() => onChange(id)} type="button">
          <Icon aria-hidden="true" size={19} strokeWidth={1.75} />
          <span>{label}</span>
          <i />
        </button>
      ))}
    </nav>
  );
}

function SectionIntro({ hint, id, title }: { hint: string; id?: string; title: string }) {
  return (
    <header className="daily-section-intro">
      <h2 id={id}>{title}</h2>
      <p>{hint}</p>
    </header>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InlineTextForm({
  label,
  onChange,
  onSubmit,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <form className="daily-inline-form" onSubmit={onSubmit}>
      <input aria-label={label} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      <button disabled={!value.trim()} type="submit">
        Add
      </button>
    </form>
  );
}

function formatOverdueLabel(days: number) {
  if (days <= 0) {
    return "Overdue";
  }

  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}

function EditableCheckRow({
  isDone,
  label,
  meta,
  onDelete,
  onRename,
  onToggle,
}: {
  isDone: boolean;
  label: string;
  meta?: string;
  onDelete: () => void;
  onRename: (title: string) => void;
  onToggle: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    onRename(trimmedDraft);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form className="daily-edit-form" onSubmit={saveEdit}>
        <input aria-label={`Edit ${label}`} value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button aria-label={`Save ${label}`} type="submit"><Check size={18} strokeWidth={1.75} /></button>
        <button aria-label={`Cancel editing ${label}`} onClick={() => setIsEditing(false)} type="button"><X size={18} strokeWidth={1.75} /></button>
      </form>
    );
  }

  return (
    <div className="daily-editable-row">
      <button className="daily-row-button" onClick={onToggle} type="button">
        <CheckGlyph isDone={isDone} />
        <span className={isDone ? "done" : undefined}>{label}</span>
        {meta && !isDone ? <small className="daily-row-meta">{meta}</small> : null}
      </button>
      <InlineActions label={label} onDelete={onDelete} onEdit={() => setIsEditing(true)} />
    </div>
  );
}

function InlineActions({ label, onDelete, onEdit }: { label: string; onDelete: () => void; onEdit: () => void }) {
  return (
    <span className="daily-inline-actions">
      <button aria-label={`Edit ${label}`} onClick={onEdit} type="button"><Pencil size={16} strokeWidth={1.75} /></button>
      <button aria-label={`Delete ${label}`} onClick={onDelete} type="button"><Trash2 size={16} strokeWidth={1.75} /></button>
    </span>
  );
}

function CheckGlyph({ isDone }: { isDone: boolean }) {
  return isDone ? <CheckCircle2 aria-hidden="true" size={23} strokeWidth={1.75} /> : <Circle aria-hidden="true" size={23} strokeWidth={1.75} />;
}

function ProgressLine({ value }: { value: number }) {
  return (
    <span className="daily-progress-line">
      <span style={{ inlineSize: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="daily-empty">{text}</p>;
}

function formatGoalProgress(snapshot: GoalSnapshot, stepCount: number) {
  if (snapshot.goal.kind === "money") {
    return `${formatRupees(Math.max(0, snapshot.progressValue))} of ${formatRupees(snapshot.goal.targetAmount ?? 0)}`;
  }

  const total = stepCount || "no";
  const noun = stepCount === 1 ? "step" : "steps";
  return `${snapshot.progressValue} of ${total} ${noun}`;
}

function formatGoalSummary(goalSnapshots: GoalSnapshot[]) {
  const noun = goalSnapshots.length === 1 ? "goal" : "goals";
  return `${goalSnapshots.length} active ${noun}`;
}

function getTransactionMeta(transaction: TimelineData["transactions"][number], goals: TimelineGoal[]) {
  const date = formatCompactDate(transaction.date);
  const goal = goals.find((item) => item.id === transaction.goalId);
  return goal ? `${date} · ${goal.title}` : date;
}

function getTransactionsForMonth(transactions: TimelineData["transactions"], date: string) {
  const monthPrefix = date.slice(0, 7);
  return transactions.filter((transaction) => transaction.date.startsWith(monthPrefix));
}

function sumTransactions(transactions: TimelineData["transactions"], type: MoneyMode) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

function getWeekDays(date: string) {
  const selected = new Date(`${date}T00:00:00`);
  const mondayOffset = (selected.getDay() + 6) % 7;
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const dayOfMonth = day.getDate();
    const dateValue = formatDateInputValue(day);

    return {
      date: dateValue,
      dayOfMonth,
      weekday: weekDayLabels[index],
    };
  });
}

function getMonthPickerDays(date: string) {
  const visible = new Date(`${date.slice(0, 7)}-01T00:00:00`);
  const start = new Date(visible);
  start.setDate(1 - ((visible.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);

    return {
      date: formatDateInputValue(day),
      dayOfMonth: day.getDate(),
      isCurrentMonth: day.getMonth() === visible.getMonth(),
    };
  });
}

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function formatReadableDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function normalizeTag(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
}

function getStoredTheme(): ThemeMode {
  return localStorage.getItem("anchor-theme") === "dark" ? "dark" : "light";
}
