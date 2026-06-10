import { describe, expect, it } from "vitest";
import { demoReport } from "./fixtures";
import { toFlaggedOrdersCsv, toJurisdictionCsv } from "./export";

describe("sales tax exports", () => {
  it("creates jurisdiction CSV with advisory labels", () => {
    const csv = toJurisdictionCsv(demoReport);

    expect(csv).toContain("jurisdiction_id,jurisdiction,state,rate");
    expect(csv).toContain("advisory — confirm before filing");
    expect(csv).toContain("NY-100");
  });

  it("creates flagged-order CSV without buyer PII columns", () => {
    const csv = toFlaggedOrdersCsv(demoReport);

    expect(csv).toContain("order_reference,order_date,jurisdiction_id");
    expect(csv).toContain("untaxed_but_taxable");
    expect(csv).not.toMatch(/email|phone|street|buyer|customer/i);
  });
});
