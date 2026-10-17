import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { api, ApiError } from "../services/api"
import SettingsScreen from "./SettingsScreen"

const codes = Array.from({ length: 10 }, (_, index) =>
  `${index + 1}`.padStart(16, "0"),
)

async function openSecurity() {
  await userEvent.click(screen.getByRole("button", { name: "Security" }))
}

describe("Settings backup codes", () => {
  afterEach(() => vi.restoreAllMocks())

  it("shows the server-provided remaining count and no reveal action", async () => {
    vi.spyOn(api, "backupCodesStatus").mockResolvedValue({
      success: true,
      totalCodes: 10,
      unusedCodes: 8,
      usedCodes: 2,
    })
    render(<SettingsScreen role="trade-tester" />)

    await openSecurity()

    expect(
      await screen.findByText("8 of 10 backup codes remaining"),
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /view backup codes/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /regenerate/i }),
    ).not.toBeInTheDocument()
  })

  it("shows unavailable status instead of zero when status loading fails", async () => {
    vi.spyOn(api, "backupCodesStatus").mockRejectedValue(new Error("offline"))
    render(<SettingsScreen role="trade-tester" />)

    await openSecurity()

    expect(
      await screen.findByText(/backup code status unavailable/i),
    ).toBeVisible()
    expect(screen.queryByText(/0 of 0/i)).not.toBeInTheDocument()
  })

  it("shows generated codes once and requires acknowledgement before close", async () => {
    vi.spyOn(api, "backupCodesStatus").mockResolvedValue({
      success: true,
      totalCodes: 0,
      unusedCodes: 0,
      usedCodes: 0,
    })
    vi.spyOn(api, "generateBackupCodes").mockResolvedValue({
      success: true,
      message: "generated",
      backupCodes: codes,
    })
    const writeText = vi.fn(async () => undefined)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    const createObjectURL = vi.fn(() => "blob:backup-codes")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    render(<SettingsScreen role="trade-tester" />)

    await openSecurity()
    await userEvent.click(
      await screen.findByRole("button", { name: "Generate Backup Codes" }),
    )

    expect(
      await screen.findByText(
        "These codes will never be displayed again. Save them in a secure location.",
      ),
    ).toBeVisible()
    expect(screen.getByText(codes[0])).toBeVisible()
    expect(screen.getByText(codes[9])).toBeVisible()
    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled()

    await userEvent.click(screen.getByRole("button", { name: "Copy All" }))
    expect(writeText).toHaveBeenCalledWith(codes.join("\n"))
    expect(await screen.findByText("Copied to clipboard")).toBeVisible()

    await userEvent.click(
      screen.getByRole("button", { name: "Download as .txt" }),
    )
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:backup-codes")

    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "I have safely saved these 10 recovery codes",
      }),
    )
    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() =>
      expect(screen.queryByText(codes[0])).not.toBeInTheDocument(),
    )
  })

  it("handles 409 without fabricating replacement codes", async () => {
    const status = vi
      .spyOn(api, "backupCodesStatus")
      .mockResolvedValueOnce({
        success: true,
        totalCodes: 0,
        unusedCodes: 0,
        usedCodes: 0,
      })
      .mockResolvedValue({
        success: true,
        totalCodes: 10,
        unusedCodes: 10,
        usedCodes: 0,
      })
    vi.spyOn(api, "generateBackupCodes").mockRejectedValue(
      new ApiError("Backup codes already exist", 409),
    )
    render(<SettingsScreen role="trade-tester" />)

    await openSecurity()
    await userEvent.click(
      await screen.findByRole("button", { name: "Generate Backup Codes" }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backup codes already exist",
    )
    await waitFor(() => expect(status).toHaveBeenCalledTimes(2))
    expect(screen.queryByText(codes[0])).not.toBeInTheDocument()
  })
})
