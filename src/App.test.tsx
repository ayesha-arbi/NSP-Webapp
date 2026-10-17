import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"
import { api } from "./services/api"
import { authStore } from "./services/authStore"

vi.mock("./services/offlineQueue", () => ({
  startQueueSync: vi.fn(() => () => undefined),
  flushQueue: vi.fn(async () => undefined),
}))

const user = {
  id: "user-1",
  email: "tradetester@nsp.com",
  role: "TRADE_TESTER" as const,
  hubLocationId: 1,
}

describe("App authentication navigation", () => {
  beforeEach(() => authStore.clearSession())
  afterEach(() => {
    vi.restoreAllMocks()
    authStore.clearSession()
  })

  it("routes IP-01 to IP-02 and IP-03 without persisting the password", async () => {
    vi.spyOn(api, "login").mockResolvedValue({
      success: true,
      message: "MFA required",
      mfaRequired: true,
      user,
    })
    render(<App />)

    await userEvent.click(screen.getByRole("button", { name: "Sign In" }))
    expect(await screen.findByRole("heading", { name: "Verify your identity" })).toBeVisible()

    await userEvent.click(
      screen.getByRole("button", {
        name: /lost your authenticator device.*use a backup code/i,
      }),
    )
    expect(await screen.findByRole("heading", { name: "Use a backup code" })).toBeVisible()
    expect(screen.getByText(user.email)).toBeVisible()
    expect(sessionStorage.getItem("password")).toBeNull()
    expect(localStorage.getItem("password")).toBeNull()

    await userEvent.click(screen.getByRole("button", { name: "Back to authenticator" }))
    expect(await screen.findByRole("heading", { name: "Verify your identity" })).toBeVisible()

    await userEvent.click(
      screen.getByRole("button", {
        name: /lost your authenticator device.*use a backup code/i,
      }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Back to login" }))
    expect(await screen.findByRole("heading", { name: "Sign in to Issuer Portal" })).toBeVisible()
  })
})
