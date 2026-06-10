import { toFlaggedOrdersCsv } from "@/lib/sales-tax/export";
import { getReportForRequest } from "@/lib/wix/report";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const report = await getReportForRequest(request);
  const csv = toFlaggedOrdersCsv(report);

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="wix-sales-tax-flagged-orders.csv"`
    }
  });
}
