import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h1>Not found</h1>
      <p>This task does not exist or was deleted.</p>
      <Link href="/" className="button">
        Back to tasks
      </Link>
    </div>
  );
}
