import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api, ApiError } from "../services/api"
import { authStore } from "../services/authStore"
import BackupCodeScreen from "./BackupCodeScreen"

const user = {
  id: "user-1",
  email: "tradetester@nsp.com",
  role: "TRADE_TESTER" as const,
  hubLocationId: 1,
}

function renderScreen() {
  return render(
    <BackupCodeScreen
      email={user.email}
      password="Password123!"
      onSuccess={vi.fn()}
      onBackToMfa={vi.fn()}
      onBackToLogin={vi.fn()}
    />,
  )
}

async function submitCode(code = "a1b2c3d4e5f67890") {
  await userEvent.type(screen.getByLabelText("Backup code"), code)
  await userEvent.click(screen.getByRole("button", { name: "Verify backup code" }))
}

describe("BackupCodeScreen", () => {
  beforeEach(() => authStore.clearSession())
  afterEach(() => {
    vi.restoreAllMocks()
    authStore.clearSession()
  })

  it("validates a blank code before calling the API", async () => {
    const verify = vi.spyOn(api, "verifyBackupCode")
    renderScreen()

    await userEvent.click(screen.getByRole("button", { name: "Verify backup code" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a backup code")
    expect(verify).not.toHaveBeenCalled()
  })

  it("submits exact credentials and stores the complete session", async () => {
    const verify = vi.spyOn(api, "verifyBackupCode").mockResolvedValue({
      success: true,
      message: "Backup code verified. Login successful.",
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user,
    })
    renderScreen()

    await submitCode()

    expect(verify).toHaveBeenCalledWith(
      user.email,
      "Password123!",
      "a1b2c3d4e5f67890",
    )
    await waitFor(() =>
      expect(authStore.getState()).toMatchObject({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        isAuthenticated: true,
      }),
    )
    expect(localStorage.getItem("password")).toBeNull()
    expect(sessionStorage.getItem("password")).toBeNull()
  })

  it("asks for another unused code when the code was consumed", async () => {
    vi.spyOn(api, "verifyBackupCode").mockRejectedValue(
      new ApiError("Invalid or already-used backup code", 401),
    )
    renderScreen()

    await submitCode()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /try another unused code/i,
    )
  })

  it("shows a 15-minute lockout alert", async () => {
    vi.spyOn(api, "verifyBackupCode").mockRejectedValue(
      new ApiError("Account locked. Please try again later.", 401),
    )
    renderScreen()

    await submitCode()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /temporarily suspended for 15 minutes/i,
    )
  })

  it.each([
    [429, "Too many requests", /cooldown/i],
    [0, "offline", /cannot reach the server/i],
  ])("maps status %s without implying the code was consumed", async (status, message, expected) => {
    vi.spyOn(api, "verifyBackupCode").mockRejectedValue(
      new ApiError(message, status),
    )
    renderScreen()

    await submitCode()

    expect(await screen.findByRole("alert")).toHaveTextContent(expected)
    expect(screen.getByRole("alert")).not.toHaveTextContent(/consumed/i)
  })
})
