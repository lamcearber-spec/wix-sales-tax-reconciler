import { describe, expect, it } from "vitest";
import { demoReport } from "./fixtures";
import { renderReconciliationPdf } from "./pdf";

describe("renderReconciliationPdf", () => {
  it("renders a non-empty PDF", async () => {
    const pdf = await renderReconciliationPdf(demoReport);

    expect(pdf.length).toBeGreaterThan(1000);
    expect(Buffer.from(pdf).toString("utf8", 0, 4)).toBe("%PDF");
  });
});
