import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "../services/api"
import { authStore } from "../services/authStore"
import MFAScreen from "./MFAScreen"

const user = {
  id: "user-1",
  email: "tradetester@nsp.com",
  role: "TRADE_TESTER" as const,
  hubLocationId: 1,
}

async function enterMfa(container: HTMLElement) {
  const inputs = Array.from(
    container.querySelectorAll<HTMLInputElement>(".otp-input"),
  )
  for (let index = 0; index < inputs.length; index += 1) {
    await userEvent.type(inputs[index], String(index + 1))
  }
  await userEvent.click(screen.getByRole("button", { name: "Verify" }))
}

describe("MFAScreen", () => {
  beforeEach(() => authStore.clearSession())
  afterEach(() => {
    vi.restoreAllMocks()
    authStore.clearSession()
  })

  it("stores both tokens after successful MFA", async () => {
    vi.spyOn(api, "verifyMfa").mockResolvedValue({
      success: true,
      message: "verified",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user,
    })
    const { container } = render(
      <MFAScreen email={user.email} onSuccess={vi.fn()} onBack={vi.fn()} />,
    )

    await enterMfa(container)

    await waitFor(() =>
      expect(authStore.getState()).toMatchObject({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        isAuthenticated: true,
      }),
    )
  })

  it("does not authenticate an incomplete success payload", async () => {
    vi.spyOn(api, "verifyMfa").mockResolvedValue({
      success: true,
      message: "verified",
      accessToken: "access-token",
      user,
    })
    const { container } = render(
      <MFAScreen email={user.email} onSuccess={vi.fn()} onBack={vi.fn()} />,
    )

    await enterMfa(container)

    await screen.findByText(/complete authentication session/i)
    expect(authStore.getState().isAuthenticated).toBe(false)
  })

  it("navigates to dedicated recovery instead of opening a modal", async () => {
    const onUseBackupCode = vi.fn()
    render(
      <MFAScreen
        email={user.email}
        onSuccess={vi.fn()}
        onBack={vi.fn()}
        onUseBackupCode={onUseBackupCode}
      />,
    )

    await userEvent.click(
      screen.getByRole("button", {
        name: /lost your authenticator device.*use a backup code/i,
      }),
    )

    expect(onUseBackupCode).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole("heading", { name: "Use Backup Code" }),
    ).not.toBeInTheDocument()
  })
})
