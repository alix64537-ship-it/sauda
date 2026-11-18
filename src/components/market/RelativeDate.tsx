import { useEffect, useState } from "react";
import { formatDistanceToNowStrict, isToday, isYesterday, format } from "date-fns";
import { ru } from "date-fns/locale";

export function relativeDate(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60 * 60 * 1000) {
    const mins = Math.max(1, Math.round(diff / 60000));
    return `${formatDistanceToNowStrict(Date.now() - mins * 60000, { locale: ru })} назад`;
  }
  if (isToday(ts)) return `Сегодня, ${format(ts, "HH:mm")}`;
  if (isYesterday(ts)) return `Вчера, ${format(ts, "HH:mm")}`;
  return format(ts, "d MMMM", { locale: ru });
}

/** Rendered only after hydration: server and browser time zones differ. */
export function RelativeDate({ ts, className }: { ts: number; className?: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => setLabel(relativeDate(ts)), [ts]);
  return (
    <time className={className} suppressHydrationWarning>
      {label ?? "\u00A0"}
    </time>
  );
}
