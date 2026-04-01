// Global test setup for vitest
// Runs before every test file.
// Only mock modules that are truly external (DB, Redis, auth).
// Do NOT mock modules that have dedicated test files (slug, format, cache).

import { vi } from "vitest"

// Silence noise in test output
vi.spyOn(console, "debug").mockImplementation(() => undefined)
vi.spyOn(console, "error").mockImplementation(() => undefined)

// ---------------------------------------------------------------------------
// Mock next-auth (no real auth server needed)
// ---------------------------------------------------------------------------
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))
