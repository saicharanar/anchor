import { anchorDatabase } from "../db";
import type { Space } from "../../shared/types/spaces";

export async function getAllSpaces() {
  return anchorDatabase.spaces.orderBy("updatedAt").reverse().toArray();
}

export async function saveSpace(space: Space) {
  await anchorDatabase.spaces.put(space);
  return space;
}

export async function deleteSpaceWithCards(spaceId: string) {
  await anchorDatabase.transaction("rw", anchorDatabase.spaces, anchorDatabase.cards, async () => {
    await anchorDatabase.cards.where("spaceId").equals(spaceId).delete();
    await anchorDatabase.spaces.delete(spaceId);
  });
}

export async function replaceSpaces(spaces: Space[]) {
  await anchorDatabase.spaces.clear();
  await anchorDatabase.spaces.bulkPut(spaces);
}
