import { demoReport } from "@/lib/sales-tax/fixtures";
import type { ReconciliationReport } from "@/lib/sales-tax/types";
import { fetchWixAccessToken, fetchWixSalesTaxReport } from "./client";
import { readInstanceIdFromCookie } from "./session";

export async function getReportForRequest(request: Request): Promise<ReconciliationReport> {
  const url = new URL(request.url);
  const periodStart = url.searchParams.get("from") ?? demoReport.periodStart;
  const periodEnd = url.searchParams.get("to") ?? demoReport.periodEnd;
  const instanceId =
    url.searchParams.get("instanceId") ?? readInstanceIdFromCookie(request.headers.get("cookie"));
  const appId = process.env.WIX_APP_ID;
  const appSecret = process.env.WIX_APP_SECRET;

  if (!appId || !appSecret || !instanceId) {
    return {
      ...demoReport,
      periodStart,
      periodEnd
    };
  }

  const accessToken = await fetchWixAccessToken({ appId, appSecret, instanceId });
  return fetchWixSalesTaxReport({
    accessToken,
    periodStart,
    periodEnd
  });
}
