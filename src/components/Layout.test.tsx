import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import Layout from "./Layout"
import { authStore } from "../services/authStore"

describe("Layout sign out", () => {
  afterEach(() => authStore.clearSession())

  it("shows the signed-in user's hub in the header", () => {
    authStore.setSession(
      { id: 1, email: "tradetester.hub4@nsp.com", role: "TRADE_TESTER", hubLocationId: 4 } as never,
      "access",
      "refresh",
    )
    render(
      <Layout currentScreen="dashboard" role="trade-tester" onNavigate={vi.fn()} onLogout={vi.fn()}>
        <div />
      </Layout>,
    )
    expect(screen.getByText("Hub: Faisalabad-C04")).toBeInTheDocument()
  })
  it("awaits server-side sign out and prevents duplicate confirmation", async () => {
    let finishLogout: (() => void) | undefined
    const onLogout = vi.fn(
      () => new Promise<void>((resolve) => (finishLogout = resolve)),
    )

    render(
      <Layout
        currentScreen="dashboard"
        role="trade-tester"
        onNavigate={vi.fn()}
        onLogout={onLogout}
      >
        <div>Dashboard content</div>
      </Layout>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Sign Out" }))
    const confirm = screen.getByRole("button", { name: "Yes, Sign Out" })
    await userEvent.click(confirm)

    expect(onLogout).toHaveBeenCalledOnce()
    expect(
      screen.getByRole("button", { name: "Signing out..." }),
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()

    finishLogout?.()
  })
})
