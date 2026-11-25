"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty">
      <h1>Something went wrong</h1>
      <p className="error-text">{error.message}</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
