import { describe, expect, it } from "vitest";
import { demoOrders, demoTransactions } from "./fixtures";
import { normalizeWixOrder, reconcileOrders } from "./reconcile";

describe("reconcileOrders", () => {
  it("buckets collected-vs-expected sales tax by jurisdiction", () => {
    const report = reconcileOrders({
      orders: demoOrders,
      transactionsByOrderId: demoTransactions,
      periodStart: "2026-05-01",
      periodEnd: "2026-06-10",
      generatedAt: "2026-06-10T08:00:00.000Z"
    });

    const ny = report.jurisdictions.find((jurisdiction) => jurisdiction.jurisdictionId === "NY-100");
    const tx = report.jurisdictions.find((jurisdiction) => jurisdiction.jurisdictionId === "TX-733");

    expect(report.totals.orderCount).toBe(4);
    expect(report.totals.flaggedOrderCount).toBe(3);
    expect(ny?.expectedTax).toBe(17.75);
    expect(ny?.variance).toBe(-2.75);
    expect(tx?.expectedTax).toBe(9.9);
    expect(report.flags.map((flag) => flag.type)).toEqual(
      expect.arrayContaining(["under_collected", "rate_drift", "untaxed_but_taxable", "over_collected"])
    );
  });

  it("normalizes Wix order references and strips shipping details from the output model", () => {
    const normalized = normalizeWixOrder(demoOrders[0], demoTransactions.ord_ca_clean);

    expect(normalized.orderNumber).toBe("1401");
    expect(normalized.state).toBe("CA");
    expect(normalized.postalCode).toBe("94107");
    expect(normalized).not.toHaveProperty("email");
    expect(normalized).not.toHaveProperty("streetAddress");
  });
});
