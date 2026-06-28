import { SPACE_COLORS, SPACE_ICONS } from "../../shared/constants/spaces";
import { createId } from "../../shared/utils/id";
import type { SpaceFormValues } from "../../shared/schemas/spaceSchemas";
import type { Space } from "../../shared/types/spaces";

export function createSpaceFromForm(values: SpaceFormValues): Space {
  const timestamp = new Date().toISOString();

  return {
    id: createId("space"),
    name: values.name,
    description: values.description,
    icon: values.icon || SPACE_ICONS[0],
    color: values.color || SPACE_COLORS[0],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateSpaceFromForm(space: Space, values: SpaceFormValues): Space {
  return {
    ...space,
    ...values,
    updatedAt: new Date().toISOString(),
  };
}
