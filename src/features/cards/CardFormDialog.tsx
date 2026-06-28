import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { useAnchorStore } from "../../app/useAnchorStore";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input, Textarea } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { CARD_TYPE_META } from "../../shared/constants/cardTypes";
import type { AnchorCard, CardType } from "../../shared/types/cards";
import { getTodayDateInputValue } from "../../shared/utils/dates";
import { createId } from "../../shared/utils/id";
import { createCardFromForm, createDefaultContent, updateCardFromForm } from "./cardFactory";
import { cardFormSchema, type CardFormValues } from "./cardFormSchema";

type CardFormDialogProps = {
  open: boolean;
  onClose: () => void;
  spaceId: string;
  card?: AnchorCard;
};

export function CardFormDialog({ open, onClose, spaceId, card }: CardFormDialogProps) {
  const upsertCard = useAnchorStore((state) => state.upsertCard);
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    values: card ? getCardFormValues(card) : ({ type: "goal", title: "", content: createDefaultContent("goal") } as CardFormValues),
  });
  const selectedType = form.watch("type");

  function changeCardType(cardType: CardType) {
    form.setValue("type", cardType);
    form.setValue("content", createDefaultContent(cardType));
  }

  async function submitCard(values: CardFormValues) {
    const nextCard = card ? updateCardFromForm(card, values) : createCardFromForm(spaceId, values);
    await upsertCard(nextCard);
    form.reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={card ? "Edit item" : "Create item"}
      description={card ? undefined : "Pick what you want to track."}
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(submitCard)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-anchor-text">
            Type
            <Select
              className="mt-2"
              value={selectedType}
              disabled={Boolean(card)}
              onChange={(event) => changeCardType(event.target.value as CardType)}
            >
              {CARD_TYPE_META.map((meta) => (
                <option key={meta.type} value={meta.type}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="block text-sm font-medium text-anchor-text">
            Title
            <Input className="mt-2" placeholder="What are you tracking?" {...form.register("title")} />
          </label>
        </div>

        <CardTypeFields form={form} selectedType={selectedType} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{card ? "Save changes" : "Create item"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

type CardTypeFieldsProps = {
  form: ReturnType<typeof useForm<CardFormValues>>;
  selectedType: CardType;
};

function CardTypeFields({ form, selectedType }: CardTypeFieldsProps) {
  if (selectedType === "goal") {
    return <GoalFields form={form} />;
  }

  if (selectedType === "checklist") {
    return <ChecklistFields form={form} />;
  }

  if (selectedType === "habit") {
    return <HabitFields form={form} />;
  }

  if (selectedType === "expense") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-anchor-text">
          Amount
          <Input
            className="mt-2"
            type="number"
            min="0"
            step="0.01"
            {...form.register("content.amount", { valueAsNumber: true })}
          />
        </label>
        <label className="block text-sm font-medium text-anchor-text">
          Category
          <Input className="mt-2" {...form.register("content.category")} />
        </label>
        <label className="block text-sm font-medium text-anchor-text">
          Date
          <Input className="mt-2" type="date" {...form.register("content.date")} />
        </label>
        <label className="block text-sm font-medium text-anchor-text">
          Type
          <Select className="mt-2" {...form.register("content.transactionType")}>
            <option value="spent">Spent</option>
            <option value="credited">Credited</option>
          </Select>
        </label>
        <label className="mt-8 flex items-center gap-2 text-sm font-medium text-anchor-text">
          <input type="checkbox" {...form.register("content.recurring")} />
          Recurring
        </label>
      </div>
    );
  }

  if (selectedType === "progress") {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-anchor-text">
          Current value
          <Input
            className="mt-2"
            type="number"
            min="0"
            {...form.register("content.currentValue", { valueAsNumber: true })}
          />
        </label>
        <label className="block text-sm font-medium text-anchor-text">
          Target value
          <Input
            className="mt-2"
            type="number"
            min="1"
            {...form.register("content.targetValue", { valueAsNumber: true })}
          />
        </label>
        <label className="block text-sm font-medium text-anchor-text">
          Unit
          <Input className="mt-2" {...form.register("content.unit")} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-anchor-text">
        Note
        <Textarea className="mt-2" {...form.register("content.content")} />
      </label>
      <label className="block text-sm font-medium text-anchor-text">
        Tags
        <Input
          className="mt-2"
          placeholder="comma, separated, tags"
          value={(form.watch("content.tags") as string[] | undefined)?.join(", ") ?? ""}
          onChange={(event) =>
            form.setValue(
              "content.tags",
              event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            )
          }
        />
      </label>
    </div>
  );
}

function getCardFormValues(card: AnchorCard): CardFormValues {
  if (card.type === "goal") {
    return {
      type: "goal",
      title: card.title,
      content: {
        ...card.content,
        tasks: card.content.tasks ?? [],
      },
    };
  }

  return { type: card.type, title: card.title, content: card.content } as CardFormValues;
}

function GoalFields({ form }: { form: ReturnType<typeof useForm<CardFormValues>> }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "content.tasks" as never,
  });

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-anchor-text">
        Description
        <Textarea className="mt-2" {...form.register("content.description")} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-anchor-text">
          Target date
          <Input className="mt-2" type="date" {...form.register("content.targetDate")} />
        </label>
        <label className="block text-sm font-medium text-anchor-text">
          Status
          <Select className="mt-2" {...form.register("content.status")}>
            <option value="not-started">Not started</option>
            <option value="in-progress">In progress</option>
            <option value="paused">Paused</option>
            <option value="complete">Complete</option>
          </Select>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-anchor-text">Milestones</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ id: createId("task"), label: "", completed: false } as never)}
          >
            <Plus className="h-4 w-4" />
            Add task
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input type="checkbox" {...form.register(`content.tasks.${index}.completed` as const)} />
            <Input placeholder="Task or milestone" {...form.register(`content.tasks.${index}.label` as const)} />
            <Button type="button" className="h-10 w-10 px-0" variant="ghost" onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistFields({ form }: { form: ReturnType<typeof useForm<CardFormValues>> }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "content.tasks" as never,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-anchor-text">Tasks</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => append({ id: createId("task"), label: "", completed: false } as never)}
        >
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <input type="checkbox" {...form.register(`content.tasks.${index}.completed` as const)} />
          <Input placeholder="Task" {...form.register(`content.tasks.${index}.label` as const)} />
          <Button type="button" className="h-10 w-10 px-0" variant="ghost" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function HabitFields({ form }: { form: ReturnType<typeof useForm<CardFormValues>> }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "content.logs" as never,
  });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-anchor-text">
        Frequency
        <Select className="mt-2" {...form.register("content.frequency")}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </Select>
      </label>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-anchor-text">Tracking log</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => append({ date: getTodayDateInputValue(), completed: true } as never)}
        >
          <Plus className="h-4 w-4" />
          Add log
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input type="date" {...form.register(`content.logs.${index}.date` as const)} />
          <label className="flex items-center gap-2 text-sm text-anchor-text">
            <input type="checkbox" {...form.register(`content.logs.${index}.completed` as const)} />
            Done
          </label>
          <Button type="button" className="h-10 w-10 px-0" variant="ghost" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
