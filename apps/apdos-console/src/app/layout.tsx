import type { Metadata } from "next";
import { ConsoleShell } from "@/components/console/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "APDOS Console",
  description: "Platform console for APDOS workflows, agents, skills, and artifacts."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConsoleShell>{children}</ConsoleShell>
      </body>
    </html>
  );
}
