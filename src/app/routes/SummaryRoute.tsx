import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { CalendarCheck, Flame, Target, WalletCards } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { getExpenseTransactionType } from "../../features/cards/cardMetrics";

export function SummaryRoute() {
  const { cards } = useAnchorStore();
  const tasks = cards.flatMap((card) => {
    if (card.type === "goal") {
      return card.content.tasks ?? [];
    }

    if (card.type === "checklist") {
      return card.content.tasks;
    }

    return [];
  });
  const completedTasks = tasks.filter((task) => task.completed).length;
  const habits = cards.filter((card) => card.type === "habit");
  const goals = cards.filter((card) => card.type === "goal");
  const financeCards = cards.filter((card) => card.type === "expense");
  const income = financeCards
    .filter((card) => getExpenseTransactionType(card) === "credited")
    .reduce((total, card) => total + (card.type === "expense" ? card.content.amount : 0), 0);
  const expenses = financeCards
    .filter((card) => getExpenseTransactionType(card) === "spent")
    .reduce((total, card) => total + (card.type === "expense" ? card.content.amount : 0), 0);

  return (
    <div className="daily-tracker">
      <header className="daily-header">
        <h1>Dashboard</h1>
        <p>A quiet summary of today and the things you are tracking.</p>
      </header>

      <section className="summary-grid">
        <SummaryTile icon={<CalendarCheck className="h-5 w-5" />} label="Tasks done" value={`${completedTasks}/${tasks.length}`} />
        <SummaryTile icon={<Flame className="h-5 w-5" />} label="Habits" value={String(habits.length)} />
        <SummaryTile icon={<Target className="h-5 w-5" />} label="Goals" value={String(goals.length)} />
        <SummaryTile icon={<WalletCards className="h-5 w-5" />} label="Balance" value={`$${(income - expenses).toFixed(0)}`} />
      </section>

      <section className="summary-panel">
        <h2>Today focus</h2>
        {tasks.filter((task) => !task.completed).slice(0, 5).map((task) => (
          <div className="summary-row" key={task.id}>
            <span>{task.label}</span>
          </div>
        ))}
        {tasks.length === 0 ? <p>No tasks yet.</p> : null}
      </section>

      <Link className="summary-settings-link" to="/settings">
        Backup, restore, and settings
      </Link>
    </div>
  );
}

function SummaryTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="summary-tile">
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
