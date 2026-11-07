import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import StepUpModal from "./StepUpModal"

describe("StepUpModal", () => {
  it("does not render when open is false", () => {
    const { container } = render(
      <StepUpModal
        open={false}
        scopeLabel="Approve Assessment"
        actionDescription="Requires MFA challenge"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders with scope label and description when open", () => {
    render(
      <StepUpModal
        open={true}
        scopeLabel="Scope: APPROVE_ASSESSMENT"
        actionDescription="Please enter your 6-digit authenticator code to proceed."
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText("Step-Up MFA Required")).toBeInTheDocument()
    expect(screen.getByText("Scope: APPROVE_ASSESSMENT")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Please enter your 6-digit authenticator code to proceed.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Verify & Continue" }),
    ).toBeDisabled()
  })

  it("enables submit only when a valid 6-digit TOTP code is entered", () => {
    const onSubmit = vi.fn()
    render(
      <StepUpModal
        open={true}
        scopeLabel="Approve Assessment"
        actionDescription="Requires MFA"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    const input = screen.getByPlaceholderText("000000")
    fireEvent.change(input, { target: { value: "12345" } })
    expect(
      screen.getByRole("button", { name: "Verify & Continue" }),
    ).toBeDisabled()

    fireEvent.change(input, { target: { value: "123456" } })
    const submitBtn = screen.getByRole("button", { name: "Verify & Continue" })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)
    expect(onSubmit).toHaveBeenCalledWith("123456", false)
  })

  it("switches to backup code mode and requires 8 characters", () => {
    const onSubmit = vi.fn()
    render(
      <StepUpModal
        open={true}
        scopeLabel="Approve Assessment"
        actionDescription="Requires MFA"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    const toggleBtn = screen.getByRole("button", {
      name: "Use a backup code instead",
    })
    fireEvent.click(toggleBtn)

    expect(screen.getByText("Backup Code (8 characters)")).toBeInTheDocument()
    const input = screen.getByPlaceholderText("ABCD1234")

    fireEvent.change(input, { target: { value: "ABC1234" } })
    expect(
      screen.getByRole("button", { name: "Verify & Continue" }),
    ).toBeDisabled()

    fireEvent.change(input, { target: { value: "ABCD1234" } })
    const submitBtn = screen.getByRole("button", { name: "Verify & Continue" })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)
    expect(onSubmit).toHaveBeenCalledWith("ABCD1234", true)
  })

  it("displays error messages", () => {
    render(
      <StepUpModal
        open={true}
        scopeLabel="Approve Assessment"
        actionDescription="Requires MFA"
        error="Invalid MFA code. Please try again."
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(
      screen.getByText("Invalid MFA code. Please try again."),
    ).toBeInTheDocument()
  })
})
