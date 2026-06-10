import { SalesTaxDashboard } from "@/components/SalesTaxDashboard";
import { demoReport } from "@/lib/sales-tax/fixtures";
import { buildInstallUrl } from "@/lib/wix/oauth";

export default function Page() {
  const installUrl = buildOptionalInstallUrl();

  return <SalesTaxDashboard report={demoReport} installUrl={installUrl} mode="fixture" />;
}

function buildOptionalInstallUrl(): string | undefined {
  const appId = process.env.WIX_APP_ID;
  const appBaseUrl = process.env.APP_BASE_URL;
  const redirectUrl = process.env.WIX_REDIRECT_URI ?? (appBaseUrl ? `${appBaseUrl}/api/wix/callback` : undefined);

  if (!appId || !redirectUrl) {
    return undefined;
  }

  return buildInstallUrl({
    appId,
    redirectUrl,
    state: "sales-tax-reconciler"
  });
}
