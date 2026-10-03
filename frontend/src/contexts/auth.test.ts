import { describe, expect, it } from "vitest";
import type { UserPublic } from "@/lib/users";
import { getAuthRedirectTarget } from "./auth";

const authenticated = { id: "user-1" } as unknown as UserPublic;

describe("getAuthRedirectTarget", () => {
  it("does not redirect while the session probe is still loading", () => {
    expect(getAuthRedirectTarget(undefined, true)).toBeNull();
    expect(getAuthRedirectTarget(undefined, false)).toBeNull();
  });

  it("sends unauthenticated users from private routes to /login", () => {
    expect(getAuthRedirectTarget(null, false)).toBe("/login");
  });

  it("keeps unauthenticated users on public routes", () => {
    expect(getAuthRedirectTarget(null, true)).toBeNull();
  });

  it("sends authenticated users from public routes home", () => {
    expect(getAuthRedirectTarget(authenticated, true)).toBe("/");
  });

  it("keeps authenticated users on private routes", () => {
    expect(getAuthRedirectTarget(authenticated, false)).toBeNull();
  });
});
