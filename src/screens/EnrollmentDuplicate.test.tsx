import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as apiModule from "../services/api"
import { api, ApiError } from "../services/api"
import EnrollmentScreen from "./EnrollmentScreen"

describe("Duplicate Candidate Enrollment Flow", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function fillAndSelect(container: HTMLElement, cnic: string, fullName: string = "Zahid Ahmed") {
    const fullNameInput = screen.getByPlaceholderText(/Muhammad Aamir Khan/i)
    const fatherNameInput = screen.getByPlaceholderText(/Khan Muhammad/i)
    const dobInput = container.querySelector('input[type="date"]') as HTMLInputElement
    const cnicInput = screen.getByPlaceholderText("XXXXX-XXXXXXX-X")

    await userEvent.type(fullNameInput, fullName)
    await userEvent.type(fatherNameInput, "Ahmed Khan")
    await userEvent.type(dobInput, "1995-05-12")
    await userEvent.type(cnicInput, cnic)

    // Select trade
    const tradeTrigger = screen.getByText(/Select trade/i)
    await userEvent.click(tradeTrigger)
    const tradeOption = await screen.findByText("Electrician")
    await userEvent.click(tradeOption)

    // Select hub if not prefilled
    const hubTrigger = screen.queryByText(/Select hub/i)
    if (hubTrigger) {
      await userEvent.click(hubTrigger)
      const hubOption = await screen.findByText("Lahore-C01")
      await userEvent.click(hubOption)
    }

    // Upload photo
    const file = new File(["dummy-img"], "photo.jpg", { type: "image/jpeg" })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, file)

    const doneBtn = await screen.findByRole("button", { name: "Done" })
    await userEvent.click(doneBtn)
  }

  it("extracts actual existing candidate record from 409 Conflict and navigates on click", async () => {
    const onNavigateToRecord = vi.fn()

    vi.spyOn(apiModule, "uploadCandidatePhoto").mockResolvedValue(
      "s3://nsp-candidates/photo.jpg",
    )

    const mockDuplicateResponse = {
      statusCode: 409,
      message: "A candidate with this CNIC already exists in the system.",
      candidate: {
        id: "CAND-REAL-99881",
        candidateId: "CAND-REAL-99881",
        fullName: "Zahid Ahmed",
        status: "APPROVED",
        hub: "Karachi-C02",
        createdAt: "2026-09-15T10:00:00.000Z",
      },
    }

    vi.spyOn(api, "enrolCandidate").mockRejectedValue(
      new ApiError("Duplicate candidate", 409, mockDuplicateResponse),
    )

    const { container } = render(
      <EnrollmentScreen onNavigateToRecord={onNavigateToRecord} />,
    )

    await fillAndSelect(container, "42101-1234567-3", "Zahid Ahmed")

    // Submit
    const submitBtn = screen.getByRole("button", {
      name: /Enrol Candidate \(Save & Continue\)/i,
    })
    await userEvent.click(submitBtn)

    // Verify modal appears with real backend response data, not placeholder CAND-2026-04821
    expect(await screen.findByText("Duplicate Candidate")).toBeInTheDocument()
    expect(screen.getByText("CAND-REAL-99881")).toBeInTheDocument()
    expect(screen.queryByText("CAND-2026-04821")).not.toBeInTheDocument()
    expect(screen.getByText("Approved")).toBeInTheDocument()
    expect(screen.getByText("Karachi-C02")).toBeInTheDocument()
    expect(screen.getByText("2026-09-15")).toBeInTheDocument()

    // Click "View Existing Record"
    const viewBtn = screen.getByRole("button", { name: "View Existing Record" })
    await userEvent.click(viewBtn)

    // Verify navigation handler was called with the correct extracted candidate ID
    expect(onNavigateToRecord).toHaveBeenCalledTimes(1)
    expect(onNavigateToRecord).toHaveBeenCalledWith(
      "CAND-REAL-99881",
      expect.objectContaining({
        id: "CAND-REAL-99881",
        status: "Approved",
        hub: "Karachi-C02",
        enrolledAt: "2026-09-15",
      }),
    )

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText("Duplicate Candidate")).not.toBeInTheDocument()
    })
  })

  it("keeps Cancel Enrollment working and dismisses the duplicate modal", async () => {
    vi.spyOn(apiModule, "uploadCandidatePhoto").mockResolvedValue(
      "s3://nsp-candidates/photo.jpg",
    )

    vi.spyOn(api, "enrolCandidate").mockRejectedValue(
      new ApiError("Duplicate CNIC", 409, {
        candidateId: "CAND-TEST-001",
        status: "Submitted",
      }),
    )

    const { container } = render(<EnrollmentScreen />)

    await fillAndSelect(container, "35202-9876543-1", "Bilal Khan")

    const submitBtn = screen.getByRole("button", {
      name: /Enrol Candidate \(Save & Continue\)/i,
    })
    await userEvent.click(submitBtn)

    expect(await screen.findByText("Duplicate Candidate")).toBeInTheDocument()

    const cancelBtn = screen.getByRole("button", { name: "Cancel Enrollment" })
    await userEvent.click(cancelBtn)

    await waitFor(() => {
      expect(screen.queryByText("Duplicate Candidate")).not.toBeInTheDocument()
    })
  })

  it("handles missing or invalid record ID gracefully without crashing", async () => {
    const onNavigateToRecord = vi.fn()

    vi.spyOn(apiModule, "uploadCandidatePhoto").mockResolvedValue(
      "s3://nsp-candidates/photo.jpg",
    )

    // 409 without any candidate ID
    vi.spyOn(api, "enrolCandidate").mockRejectedValue(
      new ApiError("Candidate already enrolled", 409, {
        message: "Duplicate candidate found but no ID provided",
      }),
    )
    vi.spyOn(api, "listCandidates").mockResolvedValue([])

    const { container } = render(
      <EnrollmentScreen onNavigateToRecord={onNavigateToRecord} />,
    )

    await fillAndSelect(container, "35201-5555555-5", "Farhan Saeed")

    const submitBtn = screen.getByRole("button", {
      name: /Enrol Candidate \(Save & Continue\)/i,
    })
    await userEvent.click(submitBtn)

    expect(await screen.findByText("Duplicate Candidate")).toBeInTheDocument()
    expect(screen.getByText("ID Not Available")).toBeInTheDocument()

    const viewBtn = screen.getByRole("button", { name: "View Existing Record" })
    await userEvent.click(viewBtn)

    // Navigation should not be called with an invalid/missing ID
    expect(onNavigateToRecord).not.toHaveBeenCalled()
    // Should display graceful warning
    expect(screen.getByText(/missing or invalid/i)).toBeInTheDocument()
  })
})
