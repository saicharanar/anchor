import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAnchorStore } from "../../app/useAnchorStore";
import { SPACE_COLORS, SPACE_ICONS } from "../../shared/constants/spaces";
import { spaceFormSchema, type SpaceFormValues } from "../../shared/schemas/spaceSchemas";
import type { Space } from "../../shared/types/spaces";
import { Button } from "../../components/ui/button";
import { Dialog } from "../../components/ui/dialog";
import { Input, Textarea } from "../../components/ui/input";
import { createSpaceFromForm, updateSpaceFromForm } from "./spaceFactory";

type SpaceFormDialogProps = {
  open: boolean;
  onClose: () => void;
  space?: Space;
};

export function SpaceFormDialog({ open, onClose, space }: SpaceFormDialogProps) {
  const upsertSpace = useAnchorStore((state) => state.upsertSpace);
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceFormSchema),
    values: {
      name: space?.name ?? "",
      description: space?.description ?? "",
      icon: space?.icon ?? SPACE_ICONS[0],
      color: space?.color ?? SPACE_COLORS[0],
    },
  });

  async function submitSpace(values: SpaceFormValues) {
    const nextSpace = space ? updateSpaceFromForm(space, values) : createSpaceFromForm(values);
    await upsertSpace(nextSpace);
    form.reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      title={space ? "Edit space" : "Create space"}
      description="Spaces organize the important areas of your life."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(submitSpace)}>
        <label className="block text-sm font-medium text-anchor-text">
          Name
          <Input className="mt-2" placeholder="Health, Money, Career..." {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </label>

        <label className="block text-sm font-medium text-anchor-text">
          Description
          <Textarea className="mt-2" placeholder="What belongs in this space?" {...form.register("description")} />
          <FieldError message={form.formState.errors.description?.message} />
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-anchor-text">Icon</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SPACE_ICONS.map((icon) => (
              <button
                key={icon}
                className={`min-h-10 rounded-xl border px-3 text-sm ${
                  form.watch("icon") === icon
                    ? "border-anchor-text bg-anchor-text text-white"
                    : "border-anchor-border bg-white text-anchor-muted"
                }`}
                type="button"
                onClick={() => form.setValue("icon", icon)}
              >
                {icon}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-anchor-text">Color</legend>
          <div className="mt-2 flex gap-2">
            {SPACE_COLORS.map((color) => (
              <button
                key={color}
                aria-label={`Use color ${color}`}
                className={`h-10 w-10 rounded-full border-2 ${
                  form.watch("color") === color ? "border-anchor-text" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                type="button"
                onClick={() => form.setValue("color", color)}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{space ? "Save changes" : "Create"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-anchor-danger">{message}</p> : null;
}
