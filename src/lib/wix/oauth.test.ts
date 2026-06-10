import { describe, expect, it } from "vitest";
import { assertReadOnlyPermissions, buildClientCredentialsTokenRequest, buildInstallUrl } from "./oauth";

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
  });
});
