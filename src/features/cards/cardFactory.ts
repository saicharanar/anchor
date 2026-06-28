import type {
  AnchorCard,
  CardContentByType,
  CardType,
  TypedAnchorCard,
} from "../../shared/types/cards";
import { getTodayDateInputValue } from "../../shared/utils/dates";
import { createId } from "../../shared/utils/id";
import type { CardFormValues } from "./cardFormSchema";

export function createDefaultContent<TCardType extends CardType>(
  cardType: TCardType,
): CardContentByType[TCardType] {
  const today = getTodayDateInputValue();

  if (cardType === "goal") {
    return {
      description: "",
      targetDate: today,
      status: "not-started",
      tasks: [],
    } as unknown as CardContentByType[TCardType];
  }

  if (cardType === "checklist") {
    return { tasks: [] } as unknown as CardContentByType[TCardType];
  }

  if (cardType === "habit") {
    return { frequency: "daily", logs: [] } as unknown as CardContentByType[TCardType];
  }

  if (cardType === "expense") {
    return {
      amount: 0,
      category: "General",
      date: today,
      recurring: false,
      transactionType: "spent",
    } as CardContentByType[TCardType];
  }

  if (cardType === "progress") {
    return { currentValue: 0, targetValue: 100, unit: "units" } as CardContentByType[TCardType];
  }

  return { content: "", tags: [] } as unknown as CardContentByType[TCardType];
}

export function createCardFromForm(spaceId: string, values: CardFormValues): AnchorCard {
  const timestamp = new Date().toISOString();

  return {
    id: createId("card"),
    spaceId,
    type: values.type,
    title: values.title,
    content: values.content,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as TypedAnchorCard<typeof values.type> as AnchorCard;
}

export function updateCardFromForm(card: AnchorCard, values: CardFormValues): AnchorCard {
  return {
    ...card,
    type: values.type,
    title: values.title,
    content: values.content,
    updatedAt: new Date().toISOString(),
  } as TypedAnchorCard<typeof values.type> as AnchorCard;
}
