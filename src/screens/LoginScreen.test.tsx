import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { api, ApiError } from "../services/api"
import LoginScreen from "./LoginScreen"

async function submitDefaultLogin() {
  await userEvent.type(
    screen.getByPlaceholderText(/you@navttc/i),
    "test@example.com",
  )
  await userEvent.type(
    screen.getByPlaceholderText(/enter your password/i),
    "password123",
  )
  await userEvent.click(screen.getByRole("button", { name: "Sign In" }))
}

describe("LoginScreen", () => {
  afterEach(() => vi.restoreAllMocks())

  it("shows an ordinary invalid-credentials response inline", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new ApiError("Invalid email or password", 401),
    )
    render(<LoginScreen onSuccess={vi.fn()} />)

    await submitDefaultLogin()

    expect(await screen.findByText("Invalid email or password")).toBeVisible()
  })

  it("shows backend lockout as a prominent 15-minute alert", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new ApiError("Account locked. Please try again later.", 401),
    )
    render(<LoginScreen onSuccess={vi.fn()} />)

    await submitDefaultLogin()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /temporarily suspended for 15 minutes/i,
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Account locked. Please try again later.",
    )
  })

  it("keeps network failures distinct from credential failures", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new ApiError("Unable to connect", 0),
    )
    render(<LoginScreen onSuccess={vi.fn()} />)

    await submitDefaultLogin()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /cannot reach the server/i,
    )
  })

  it("shows a cooldown for global rate limiting", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new ApiError("Too many requests", 429),
    )
    render(<LoginScreen onSuccess={vi.fn()} />)

    await submitDefaultLogin()

    expect(await screen.findByRole("alert")).toHaveTextContent(/cooldown/i)
  })

  it("never authenticates a demo account after an API failure", async () => {
    vi.spyOn(api, "login").mockRejectedValue(
      new ApiError("Backend unavailable", 0),
    )
    const onSuccess = vi.fn()
    render(<LoginScreen onSuccess={onSuccess} />)

    await submitDefaultLogin()

    expect(onSuccess).not.toHaveBeenCalled()
  })
})
