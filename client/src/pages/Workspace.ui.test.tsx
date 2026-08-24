import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "Alex Student" }, isAuthenticated: true }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main data-testid="workspace-shell">{children}</main>,
}));

vi.mock("@/components/AIChatBox", () => ({
  AIChatBox: () => <div>AI chat</div>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dashboard: {
      overview: {
        useQuery: () => ({ data: { metrics: { studyHours: 2.5, completedTasks: 3, totalTasks: 4, quizScore: 86, streak: 2 }, tasks: [], notes: [], deadlines: [], progress: [] }, isLoading: false }),
      },
    },
  },
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/dashboard", vi.fn()],
}));

import Workspace from "./Workspace";

describe("NovaMind protected dashboard UI", () => {
  it("renders the authenticated dashboard heading, metrics, quick actions, and empty study rhythm", () => {
    const html = renderToStaticMarkup(<Workspace />);
    expect(html).toContain("Good morning. Let’s make progress feel inevitable.");
    expect(html).toContain("Welcome back, Alex.");
    expect(html).toContain("Study hours");
    expect(html).toContain("Ask AI");
    expect(html).toContain("Log a study session from Calendar");
  });
});
