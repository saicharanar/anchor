import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, CircleCheck, Flame, WalletCards } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { Progress } from "../../components/ui/progress";
import { getDashboardSummary } from "../../features/dashboard/dashboardSelectors";
import { toggleGoalTask } from "../../features/cards/goalTasks";
import type { AnchorCard } from "../../shared/types/cards";
import { formatShortDate } from "../../shared/utils/dates";

export function DashboardRoute() {
  const { spaces, cards, upsertCard } = useAnchorStore();
  const summary = getDashboardSummary(spaces, cards);
  const todaysDateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  function toggleTodayTask(cardId: string, taskId: string) {
    const card = cards.find((item) => item.id === cardId);

    if (!card) {
      return;
    }

    if (card.type === "goal") {
      void upsertCard(toggleGoalTask(card, taskId));
      return;
    }

    if (card.type !== "checklist") {
      return;
    }

    void upsertCard({
      ...card,
      updatedAt: new Date().toISOString(),
      content: {
        tasks: card.content.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task,
        ),
      },
    });
  }

  return (
    <div className="space-y-5">
      <header className="px-1 pt-1">
        <p className="text-[13px] font-medium text-anchor-muted">{todaysDateLabel}</p>
        <h1 className="mt-1 text-[34px] font-semibold tracking-tight text-anchor-text">Today</h1>
      </header>

      <section className="liquid-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-anchor-text">Now</h2>
            <p className="mt-0.5 text-sm text-anchor-muted">
              {summary.todayTasks.length > 0
                ? `${summary.todayTasks.length} open items`
                : "Nothing urgent waiting"}
            </p>
          </div>
          <CircleCheck className="h-5 w-5 text-anchor-muted" />
        </div>

        <div className="mt-3 space-y-2">
          {summary.todayTasks.length > 0 ? (
            summary.todayTasks.map((item) => (
              <button
                key={`${item.cardId}-${item.id}`}
                className="tap-row w-full text-left"
                onClick={() => toggleTodayTask(item.cardId, item.id)}
                type="button"
              >
                <span className="tap-check" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-anchor-text">{item.label}</span>
                  <span className="block truncate text-xs text-anchor-muted">{item.sourceTitle}</span>
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-[22px] bg-white/42 px-4 py-5 text-sm text-anchor-muted">
              Add tasks inside a goal or checklist and they will show up here.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link to="/money" className="liquid-tile min-h-32 p-4">
          <WalletCards className="h-5 w-5 text-anchor-muted" />
          <span className="mt-auto">
            <span className="block text-2xl font-semibold text-anchor-text">
              ${summary.monthlySpent.toFixed(0)}
            </span>
            <span className="text-xs text-anchor-muted">spent this month</span>
          </span>
        </Link>

        <div className="liquid-tile min-h-32 p-4">
          <Flame className="h-5 w-5 text-anchor-muted" />
          <span className="mt-auto">
            <span className="block text-2xl font-semibold text-anchor-text">{summary.bestHabitStreak}</span>
            <span className="text-xs text-anchor-muted">best streak</span>
          </span>
        </div>
      </section>

      <section className="liquid-panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-anchor-text">Areas</h2>
          <Link to="/areas" className="text-sm font-medium text-anchor-muted">
            View all
          </Link>
        </div>

        <div className="mt-3 divide-y divide-white/55">
          {summary.progressBySpace.slice(0, 4).map((item) => (
            <Link key={item.space.id} to={`/spaces/${item.space.id}`} className="flex items-center gap-3 py-3">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.space.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-anchor-text">{item.space.name}</span>
                <span className="block text-xs text-anchor-muted">{item.itemCount} items</span>
              </span>
              {item.progress > 0 ? (
                <span className="w-20">
                  <Progress value={item.progress} />
                </span>
              ) : null}
              <ChevronRight className="h-4 w-4 text-anchor-muted/70" />
            </Link>
          ))}
        </div>
      </section>

      <section className="liquid-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-anchor-muted" />
          <h2 className="text-[15px] font-semibold text-anchor-text">Upcoming</h2>
        </div>
        <div className="space-y-2">
          {summary.upcomingItems.length > 0 ? (
            summary.upcomingItems.slice(0, 4).map((item) => <UpcomingRow key={item.id} card={item} />)
          ) : (
            <p className="text-sm text-anchor-muted">No dated items coming up.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function UpcomingRow({ card }: { card: AnchorCard }) {
  const date = card.type === "goal" ? card.content.targetDate : "";
  const href = card.type === "goal" || card.type === "checklist"
    ? `/spaces/${card.spaceId}/items/${card.id}`
    : `/spaces/${card.spaceId}`;

  return (
    <Link to={href} className="flex items-center justify-between gap-3 rounded-[20px] bg-white/40 px-3 py-3">
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-anchor-text">{card.title}</span>
        <span className="block text-xs text-anchor-muted">{card.type}</span>
      </span>
      <span className="shrink-0 text-xs text-anchor-muted">{formatShortDate(date)}</span>
    </Link>
  );
}
