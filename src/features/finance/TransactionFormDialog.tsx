import { useForm } from "react-hook-form";

import { useAnchorStore } from "../../app/useAnchorStore";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import type { AnchorCard } from "../../shared/types/cards";
import { getTodayDateInputValue } from "../../shared/utils/dates";
import { createId } from "../../shared/utils/id";

type TransactionFormDialogProps = {
  open: boolean;
  onClose: () => void;
  spaceId: string;
};

type TransactionFormValues = {
  amount: number;
  category: string;
  date: string;
  transactionType: "spent" | "credited";
};

export function TransactionFormDialog({ open, onClose, spaceId }: TransactionFormDialogProps) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const form = useForm<TransactionFormValues>({
    values: {
      amount: 0,
      category: "",
      date: getTodayDateInputValue(),
      transactionType: "spent",
    },
  });

  async function submitTransaction(values: TransactionFormValues) {
    const timestamp = new Date().toISOString();
    const titlePrefix = values.transactionType === "credited" ? "Credit" : "Spent";
    const title = values.category.trim() || `${titlePrefix} $${values.amount}`;
    const transaction: AnchorCard = {
      id: createId("card"),
      spaceId,
      type: "expense",
      title,
      createdAt: timestamp,
      updatedAt: timestamp,
      content: {
        amount: values.amount,
        category: values.category.trim() || "General",
        date: values.date || getTodayDateInputValue(),
        recurring: false,
        transactionType: values.transactionType,
      },
    };

    await upsertCard(transaction);
    form.reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      title="Transaction"
      description="Today is selected by default."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(submitTransaction)}>
        <div className="grid grid-cols-2 gap-3">
          <TransactionTypeButton
            active={form.watch("transactionType") === "spent"}
            label="Spent"
            onClick={() => form.setValue("transactionType", "spent")}
          />
          <TransactionTypeButton
            active={form.watch("transactionType") === "credited"}
            label="Credited"
            onClick={() => form.setValue("transactionType", "credited")}
          />
        </div>

        <label className="block text-sm font-medium text-anchor-text">
          Amount
          <Input
            className="mt-2"
            min="0"
            step="0.01"
            type="number"
            {...form.register("amount", { valueAsNumber: true })}
          />
        </label>

        <label className="block text-sm font-medium text-anchor-text">
          Category
          <Input className="mt-2" placeholder="Food, salary, medicine..." {...form.register("category")} />
        </label>

        <label className="block text-sm font-medium text-anchor-text">
          Date
          <Input className="mt-2" type="date" {...form.register("date")} />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Dialog>
  );
}

function TransactionTypeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-11 rounded-[18px] border text-sm font-medium transition active:scale-[0.98] ${
        active
          ? "border-anchor-text bg-anchor-text text-white"
          : "border-white/55 bg-white/46 text-anchor-muted backdrop-blur-xl"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
