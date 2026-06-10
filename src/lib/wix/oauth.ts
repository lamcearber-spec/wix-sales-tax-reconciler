export const WIX_INSTALL_URL = "https://www.wix.com/installer/install";
export const WIX_TOKEN_URL = "https://www.wixapis.com/oauth2/token";
export const WIX_TOKEN_INFO_URL = "https://www.wixapis.com/oauth2/token-info";

export const REQUIRED_WIX_PERMISSIONS = ["Read Orders", "Read Stores"] as const;

export type WixTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type WixTokenInfoResponse = {
  instanceId?: string;
  appInstanceId?: string;
};

export function assertReadOnlyPermissions(permissions: readonly string[]): void {
  const unsafe = permissions.find((permission) => /write|manage|create|delete|refund|file/i.test(permission));
  if (unsafe) {
    throw new Error(`Unsafe Wix permission rejected: ${unsafe}`);
  }
}

export function buildInstallUrl(input: { appId: string; redirectUrl: string; state?: string }): string {
  const params = new URLSearchParams({
    appId: input.appId,
    redirectUrl: input.redirectUrl
  });

  if (input.state) {
    params.set("state", input.state);
  }

  return `${WIX_INSTALL_URL}?${params.toString()}`;
}

export function buildClientCredentialsTokenRequest(input: {
  appId: string;
  appSecret: string;
  instanceId: string;
}): { url: string; init: RequestInit } {
  assertReadOnlyPermissions(REQUIRED_WIX_PERMISSIONS);

  return {
    url: WIX_TOKEN_URL,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: input.appId,
        client_secret: input.appSecret,
        instanceId: input.instanceId
      })
    }
  };
}

export function buildTokenInfoRequest(instanceToken: string): { url: string; init: RequestInit } {
  return {
    url: WIX_TOKEN_INFO_URL,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: instanceToken
      })
    }
  };
}
