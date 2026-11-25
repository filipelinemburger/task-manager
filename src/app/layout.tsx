import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/components/toast";
import { TRPCReactProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Simple task manager built with Next.js and tRPC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <ToastProvider>
            <header className="header">
              <Link href="/" className="brand">
                Task Manager
              </Link>
              <Link href="/tasks/new" className="button button-primary">
                + New task
              </Link>
            </header>
            <main className="container">{children}</main>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
