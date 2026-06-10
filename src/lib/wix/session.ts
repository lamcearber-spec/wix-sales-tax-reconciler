const INSTANCE_COOKIE = "wix_instance_id";

export function readInstanceIdFromCookie(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .map((part) => part.split("="))
    .find(([name]) => name === INSTANCE_COOKIE)?.[1];
}

export function buildInstanceCookie(instanceId: string): string {
  const encoded = encodeURIComponent(instanceId);
  return `${INSTANCE_COOKIE}=${encoded}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60 * 60 * 24 * 30}`;
}
