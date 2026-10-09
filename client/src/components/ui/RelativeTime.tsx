import { useSyncExternalStore } from "react";
import { getTime } from "../../utils/utils";

// one timer for the whole page, running only while something shows a time
const listeners = new Set<() => void>();
let minute = Math.floor(Date.now() / 60_000);
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    minute = Math.floor(Date.now() / 60_000);
    listeners.forEach((notify) => notify());
  }, 60_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const currentMinute = () => minute;

interface RelativeTimeProps {
  date: string;
  className?: string;
}

// "5 minutes ago", kept up to date, with the exact date on hover
export function RelativeTime({ date, className }: RelativeTimeProps) {
  useSyncExternalStore(subscribe, currentMinute);
  const exact = new Date(date);

  return (
    <time
      className={className}
      dateTime={exact.toISOString()}
      title={exact.toLocaleString("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      })}
    >
      {getTime(date)}
    </time>
  );
}
