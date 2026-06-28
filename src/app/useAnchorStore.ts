import { create } from "zustand";

import { createBackup, restoreBackup, clearLocalWorkspace } from "../storage/repositories/backupRepository";
import { deleteCard, getAllCards, saveCard } from "../storage/repositories/cardsRepository";
import {
  deleteSpaceWithCards,
  getAllSpaces,
  saveSpace,
} from "../storage/repositories/spacesRepository";
import { getMissingDefaultSpaces } from "../features/spaces/defaultSpaces";
import type { AnchorCard } from "../shared/types/cards";
import type { Space } from "../shared/types/spaces";

type AnchorStoreState = {
  spaces: Space[];
  cards: AnchorCard[];
  isLoading: boolean;
  error: string | null;
  loadWorkspace: () => Promise<void>;
  upsertSpace: (space: Space) => Promise<void>;
  removeSpace: (spaceId: string) => Promise<void>;
  upsertCard: (card: AnchorCard) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  exportWorkspace: () => Promise<string>;
  importWorkspace: (backup: unknown) => Promise<void>;
  clearWorkspace: () => Promise<void>;
};

export const useAnchorStore = create<AnchorStoreState>((set, get) => ({
  spaces: [],
  cards: [],
  isLoading: true,
  error: null,

  loadWorkspace: async () => {
    set({ isLoading: true, error: null });

    try {
      const [storedSpaces, cards] = await Promise.all([getAllSpaces(), getAllCards()]);
      const missingDefaultSpaces = getMissingDefaultSpaces(storedSpaces);

      await Promise.all(missingDefaultSpaces.map(saveSpace));

      set({ spaces: [...missingDefaultSpaces, ...storedSpaces], cards, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  upsertSpace: async (space) => {
    await saveSpace(space);
    const existingSpaces = get().spaces.filter((item) => item.id !== space.id);
    set({ spaces: [space, ...existingSpaces] });
  },

  removeSpace: async (spaceId) => {
    await deleteSpaceWithCards(spaceId);
    set({
      spaces: get().spaces.filter((space) => space.id !== spaceId),
      cards: get().cards.filter((card) => card.spaceId !== spaceId),
    });
  },

  upsertCard: async (card) => {
    await saveCard(card);
    const existingCards = get().cards.filter((item) => item.id !== card.id);
    set({ cards: [card, ...existingCards] });
  },

  removeCard: async (cardId) => {
    await deleteCard(cardId);
    set({ cards: get().cards.filter((card) => card.id !== cardId) });
  },

  exportWorkspace: async () => {
    const backup = await createBackup();
    return JSON.stringify(backup, null, 2);
  },

  importWorkspace: async (backup) => {
    await restoreBackup(backup);
    await get().loadWorkspace();
  },

  clearWorkspace: async () => {
    await clearLocalWorkspace();
    set({ spaces: [], cards: [] });
  },
}));

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
