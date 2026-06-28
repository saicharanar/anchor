import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

import { useAnchorStore } from "../useAnchorStore";
import { TransactionFormDialog } from "../../features/finance/TransactionFormDialog";
import { getDashboardSummary, type FinanceCalendarDay } from "../../features/dashboard/dashboardSelectors";
import { getExpenseTransactionType } from "../../features/cards/cardMetrics";
import { isFinanceSpace } from "../../features/spaces/defaultSpaces";
import { formatShortDate } from "../../shared/utils/dates";

export function MoneyRoute() {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const { spaces, cards } = useAnchorStore();
  const summary = getDashboardSummary(spaces, cards);
  const financeSpace = spaces.find(isFinanceSpace);
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date());
  const recentTransactions = summary.financeEntries
    .slice()
    .sort((leftEntry, rightEntry) => {
      if (leftEntry.type !== "expense" || rightEntry.type !== "expense") {
        return 0;
      }

      return rightEntry.content.date.localeCompare(leftEntry.content.date);
    })
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 px-1 pt-1">
        <div>
          <p className="text-[13px] font-medium text-anchor-muted">This month</p>
          <h1 className="mt-1 text-[34px] font-semibold tracking-tight text-anchor-text">Money</h1>
        </div>
        <button
          aria-label="Add transaction"
          className="liquid-icon-button"
          disabled={!financeSpace}
          onClick={() => setIsAddingTransaction(true)}
          type="button"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="liquid-tile min-h-28 p-4">
          <span className="text-xs font-medium text-anchor-muted">Spent</span>
          <span className="mt-auto text-3xl font-semibold text-anchor-text">${summary.monthlySpent.toFixed(0)}</span>
        </div>
        <div className="liquid-tile min-h-28 p-4">
          <span className="text-xs font-medium text-anchor-muted">Credited</span>
          <span className="mt-auto text-3xl font-semibold text-anchor-credit">${summary.monthlyCredited.toFixed(0)}</span>
        </div>
      </section>

      <FinanceCalendar days={summary.financeCalendarDays} monthLabel={monthLabel} />

      <section className="liquid-panel p-4">
        <h2 className="text-[15px] font-semibold text-anchor-text">Recent</h2>
        <div className="mt-2 divide-y divide-white/55">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              if (transaction.type !== "expense") {
                return null;
              }

              const transactionType = getExpenseTransactionType(transaction);
              const amountPrefix = transactionType === "credited" ? "+" : "-";
              const amountColor = transactionType === "credited" ? "text-anchor-credit" : "text-anchor-text";

              return (
                <Link
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 py-3"
                  to={`/spaces/${transaction.spaceId}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-anchor-text">
                      {transaction.content.category || transaction.title}
                    </span>
                    <span className="block text-xs text-anchor-muted">{formatShortDate(transaction.content.date)}</span>
                  </span>
                  <span className={`text-sm font-semibold ${amountColor}`}>
                    {amountPrefix}${transaction.content.amount.toFixed(0)}
                  </span>
                </Link>
              );
            })
          ) : (
            <p className="py-3 text-sm text-anchor-muted">No transactions yet.</p>
          )}
        </div>
      </section>

      {financeSpace ? (
        <TransactionFormDialog
          open={isAddingTransaction}
          onClose={() => setIsAddingTransaction(false)}
          spaceId={financeSpace.id}
        />
      ) : null}
    </div>
  );
}

function FinanceCalendar({ days, monthLabel }: { days: FinanceCalendarDay[]; monthLabel: string }) {
  const firstDay = days[0];
  const leadingEmptyDays = firstDay ? (firstDay.weekdayIndex + 6) % 7 : 0;

  return (
    <section className="liquid-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-anchor-text">Calendar</h2>
        <p className="text-xs text-anchor-muted">{monthLabel}</p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-anchor-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((weekday, index) => (
          <span key={`${weekday}-${index}`}>{weekday}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingEmptyDays }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {days.map((day) => (
          <FinanceCalendarCell key={day.date} day={day} />
        ))}
      </div>
    </section>
  );
}

function FinanceCalendarCell({ day }: { day: FinanceCalendarDay }) {
  const netAmount = day.credited - day.spent;
  const hasActivity = day.spent > 0 || day.credited > 0;
  const netClassName = netAmount >= 0 ? "text-anchor-credit" : "text-anchor-danger";

  return (
    <div className="min-h-14 rounded-[17px] border border-white/55 bg-white/34 px-1.5 py-1.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      <p className="text-[11px] font-medium text-anchor-text">{day.dayOfMonth}</p>
      {hasActivity ? (
        <p className={`mt-1 truncate text-[10px] font-semibold leading-tight ${netClassName}`}>
          {formatCompactSignedAmount(netAmount)}
        </p>
      ) : null}
    </div>
  );
}

function formatCompactSignedAmount(amount: number) {
  const prefix = amount >= 0 ? "+" : "-";
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= 1000) {
    return `${prefix}${(absoluteAmount / 1000).toFixed(1).replace(".0", "")}k`;
  }

  return `${prefix}${absoluteAmount.toFixed(0)}`;
}
