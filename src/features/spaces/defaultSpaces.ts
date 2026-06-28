import { DEFAULT_SPACES } from "../../shared/constants/spaces";
import type { Space } from "../../shared/types/spaces";

export function getMissingDefaultSpaces(spaces: Space[]) {
  const existingSpaceNames = new Set(spaces.map((space) => space.name.toLowerCase()));
  const timestamp = new Date().toISOString();

  return DEFAULT_SPACES.filter(
    (defaultSpace) => !existingSpaceNames.has(defaultSpace.name.toLowerCase()),
  ).map((defaultSpace) => ({
    ...defaultSpace,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function isFinanceSpace(space?: Space) {
  if (!space) {
    return false;
  }

  const spaceName = space.name.toLowerCase();
  return spaceName.includes("finance") || spaceName.includes("money");
}
