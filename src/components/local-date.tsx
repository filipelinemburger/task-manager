"use client";

import { useEffect, useState } from "react";

const utcFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/**
 * Shows a date in the user's time zone.
 *
 * The server does not know the user's time zone, so it shows UTC first.
 * Then the browser switches to local time. This avoids a hydration error.
 */
export function LocalDate({ date }: { date: Date }) {
  const [text, setText] = useState(() => `${utcFormat.format(date)} UTC`);

  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date));
  }, [date]);

  return <time dateTime={date.toISOString()}>{text}</time>;
}
