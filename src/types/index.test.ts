import { describe, it, expect } from "vitest";
import { isAdminRole } from "./index";
import type { UserRole } from "./index";

describe("isAdminRole", () => {
  it("returns true for admin", () => {
    expect(isAdminRole("admin")).toBe(true);
  });

  it("returns true for collaborator", () => {
    expect(isAdminRole("collaborator")).toBe(true);
  });

  it("returns false for client", () => {
    expect(isAdminRole("client")).toBe(false);
  });

  it("returns false for unknown role", () => {
    expect(isAdminRole("unknown" as UserRole)).toBe(false);
  });
});
