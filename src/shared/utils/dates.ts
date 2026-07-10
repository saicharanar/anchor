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
  return formatDateInputValue(new Date());
}

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
