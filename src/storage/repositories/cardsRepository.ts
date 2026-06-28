import { anchorDatabase } from "../db";
import type { AnchorCard } from "../../shared/types/cards";

export async function getAllCards() {
  return anchorDatabase.cards.orderBy("updatedAt").reverse().toArray();
}

export async function getCardsForSpace(spaceId: string) {
  return anchorDatabase.cards.where("spaceId").equals(spaceId).reverse().sortBy("updatedAt");
}

export async function saveCard(card: AnchorCard) {
  await anchorDatabase.cards.put(card);
  return card;
}

export async function deleteCard(cardId: string) {
  await anchorDatabase.cards.delete(cardId);
}

export async function replaceCards(cards: AnchorCard[]) {
  await anchorDatabase.cards.clear();
  await anchorDatabase.cards.bulkPut(cards);
}
