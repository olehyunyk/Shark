import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Jira Deadline Report",
  description: "Звіт по дедлайнах задач з Jira",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
