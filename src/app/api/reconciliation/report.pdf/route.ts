import { renderReconciliationPdf } from "@/lib/sales-tax/pdf";
import { getReportForRequest } from "@/lib/wix/report";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const report = await getReportForRequest(request);
  const pdf = await renderReconciliationPdf(report);
  const body = new Uint8Array(pdf).buffer;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="wix-sales-tax-reconciliation.pdf"`
    }
  });
}
