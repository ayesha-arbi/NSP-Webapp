import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import Layout from "./Layout"

describe("Layout sign out", () => {
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
