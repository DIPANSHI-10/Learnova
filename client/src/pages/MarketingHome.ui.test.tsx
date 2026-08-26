import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("@/const", () => ({
  startLogin: vi.fn(),
  isLocalDevelopmentMode: () => false,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

import MarketingHome from "./MarketingHome";

describe("Learnova public entry experience", () => {
  it("renders the sun-inspired study hero and learning-loop value proposition", () => {
    const html = renderToStaticMarkup(<MarketingHome />);
    expect(html).toContain("Make study time");
    expect(html).toContain("feel like sunlight");
    expect(html).toContain("Learnova AI");
    expect(html).toContain("Built around your learning loop");
    expect(html).toContain("learnova-reveal");
    expect(html).toContain("Enter Learnova");
  });
});
