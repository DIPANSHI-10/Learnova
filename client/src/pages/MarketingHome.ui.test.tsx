import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("@/const", () => ({
  startLogin: vi.fn(),
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

import MarketingHome from "./MarketingHome";

describe("NovaMind public entry experience", () => {
  it("renders the study-specific hero and learning-loop value proposition", () => {
    const html = renderToStaticMarkup(<MarketingHome />);
    expect(html).toContain("Think smarter");
    expect(html).toContain("Learn faster");
    expect(html).toContain("One place for the full learning loop");
    expect(html).toContain("NovaMind AI");
  });
});
