import { format, formatDistanceToNow } from "date-fns";

export function formatRelativeTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatFullTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return format(date, "PPpp");
}
