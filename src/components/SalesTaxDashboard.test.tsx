import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoReport } from "@/lib/sales-tax/fixtures";
import { SalesTaxDashboard } from "./SalesTaxDashboard";

describe("SalesTaxDashboard", () => {
  it("renders the operational dashboard and export actions", () => {
    render(<SalesTaxDashboard report={demoReport} mode="fixture" installUrl="https://example.com/install" />);

    expect(screen.getByRole("heading", { name: /US Sales-Tax Reconciler/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Connect Wix/i })).toHaveAttribute("href", "https://example.com/install");
    expect(screen.getByRole("link", { name: /Jurisdictions CSV/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/api/reconciliation/jurisdictions.csv")
    );
    expect(screen.getByRole("link", { name: /Return PDF/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/api/reconciliation/report.pdf")
    );
    expect(screen.getAllByText("advisory — confirm before filing").length).toBeGreaterThan(1);
  });
});
