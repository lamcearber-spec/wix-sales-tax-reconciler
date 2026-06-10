import { buildInstanceCookie } from "@/lib/wix/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const instanceId = url.searchParams.get("instanceId") ?? url.searchParams.get("instance_id");
  const redirectUrl = new URL("/", url.origin);

  if (!instanceId) {
    redirectUrl.searchParams.set("connection", "missing-instance");
    return Response.redirect(redirectUrl);
  }

  redirectUrl.searchParams.set("connection", "wix");
  const response = Response.redirect(redirectUrl);
  response.headers.append("set-cookie", buildInstanceCookie(instanceId));
  return response;
}
