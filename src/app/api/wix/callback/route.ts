import { buildInstanceCookie } from "@/lib/wix/session";
import { fetchWixInstanceId } from "@/lib/wix/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let instanceId = url.searchParams.get("instanceId") ?? url.searchParams.get("instance_id");
  const instanceToken = url.searchParams.get("instance");
  const redirectUrl = new URL("/", url.origin);

  if (!instanceId && instanceToken) {
    try {
      instanceId = await fetchWixInstanceId({ instanceToken });
    } catch {
      redirectUrl.searchParams.set("connection", "invalid-instance");
      return Response.redirect(redirectUrl);
    }
  }

  if (!instanceId) {
    redirectUrl.searchParams.set("connection", "missing-instance");
    return Response.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("connection", "wix");
  const response = Response.redirect(redirectUrl);
  response.headers.append("set-cookie", buildInstanceCookie(instanceId));
  return response;
}
