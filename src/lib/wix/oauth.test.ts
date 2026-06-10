import { describe, expect, it } from "vitest";
import { assertReadOnlyPermissions, buildClientCredentialsTokenRequest, buildInstallUrl, buildTokenInfoRequest } from "./oauth";

describe("Wix OAuth helpers", () => {
  it("rejects write-like permissions", () => {
    expect(() => assertReadOnlyPermissions(["Read Orders", "Manage Orders"])).toThrow(/Unsafe Wix permission/);
  });

  it("builds an app install URL", () => {
    expect(
      buildInstallUrl({
        appId: "app_123",
        redirectUrl: "https://example.com/api/wix/callback",
        state: "sales-tax-reconciler"
      })
    ).toContain("https://www.wix.com/installer/install?");
  });

  it("builds a client credentials token request without write scopes", () => {
    const request = buildClientCredentialsTokenRequest({
      appId: "app_123",
      appSecret: "secret",
      instanceId: "instance"
    });

    expect(request.url).toBe("https://www.wixapis.com/oauth2/token");
    expect(request.init.method).toBe("POST");
    expect(String(request.init.body)).toContain('"grant_type":"client_credentials"');
    expect(String(request.init.body)).toContain('"instanceId":"instance"');
    expect(String(request.init.body)).not.toContain("instance_id");
  });

  it("builds a token-info request for signed iframe instance data", () => {
    const request = buildTokenInfoRequest("signed-instance-token");

    expect(request.url).toBe("https://www.wixapis.com/oauth2/token-info");
    expect(request.init.method).toBe("POST");
    expect(JSON.parse(String(request.init.body))).toEqual({ token: "signed-instance-token" });
  });
});
