import { demoReport } from "@/lib/sales-tax/fixtures";
import type { ReconciliationReport } from "@/lib/sales-tax/types";
import { fetchWixAccessToken, fetchWixInstanceId, fetchWixSalesTaxReport } from "./client";
import { readInstanceIdFromCookie } from "./session";

export async function getReportForRequest(request: Request): Promise<ReconciliationReport> {
  const url = new URL(request.url);
  const periodStart = url.searchParams.get("from") ?? demoReport.periodStart;
  const periodEnd = url.searchParams.get("to") ?? demoReport.periodEnd;
  let instanceId =
    url.searchParams.get("instanceId") ?? readInstanceIdFromCookie(request.headers.get("cookie"));
  const instanceToken = url.searchParams.get("instance");
  const appId = process.env.WIX_APP_ID;
  const appSecret = process.env.WIX_APP_SECRET;

  if (!appId || !appSecret) {
    return {
      ...demoReport,
      periodStart,
      periodEnd
    };
  }

  if (!instanceId && instanceToken) {
    instanceId = await fetchWixInstanceId({ instanceToken });
  }

  if (!instanceId) {
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
