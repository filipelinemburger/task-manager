"use client";

import { useEffect, useState } from "react";

const utcFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/**
 * Shows a date in the visitor's time zone.
 *
 * The server does not know the visitor's time zone, so the first render (the
 * SSR HTML) uses UTC; after hydration the browser switches to local time. This
 * avoids a hydration mismatch between server and client text.
 */
export function LocalDate({ date }: { date: Date }) {
  const [text, setText] = useState(() => `${utcFormat.format(date)} UTC`);

  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date));
  }, [date]);

  return <time dateTime={date.toISOString()}>{text}</time>;
}
