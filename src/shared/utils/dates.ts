export function formatShortDate(value?: string) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function isUpcomingDate(value?: string) {
  if (!value) {
    return false;
  }

  const today = new Date(getTodayDateInputValue()).getTime();
  const targetDate = new Date(value).getTime();
  return targetDate >= today;
}

export function sortNewestFirst<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort(
    (leftItem, rightItem) =>
      new Date(rightItem.updatedAt).getTime() - new Date(leftItem.updatedAt).getTime(),
  );
}
