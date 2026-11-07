import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import * as apiModule from "../services/api"
import { api, ApiError } from "../services/api"
import EnrollmentScreen from "./EnrollmentScreen"

describe("FR-CAND-01: 60-Candidate Enrolment Hub Quota Enforcement", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.skip("displays alert banner and disables submit button when hub quota (409) is exceeded", async () => {
    vi.spyOn(apiModule, "uploadCandidatePhoto").mockResolvedValue(
      "s3://nsp-candidates/photo.jpg",
    )
    vi.spyOn(api, "enrolCandidate").mockRejectedValue(
      new ApiError(
        "This testing hub has reached its maximum enrolment limit of 60 candidates",
        409,
        {
          statusCode: 409,
          message:
            "This testing hub has reached its maximum enrolment limit of 60 candidates",
        },
      ),
    )

    const { container } = render(<EnrollmentScreen />)

    // Fill form fields
    const fullNameInput = screen.getByPlaceholderText(/Muhammad Aamir Khan/i)
    const fatherNameInput = screen.getByPlaceholderText(/Khan Muhammad/i)
    const dobInput = container.querySelector('input[type="date"]') as HTMLInputElement
    const cnicInput = screen.getByPlaceholderText("XXXXX-XXXXXXX-X")

    await userEvent.type(fullNameInput, "Muhammad Ali")
    await userEvent.type(fatherNameInput, "Tariq Ali")
    await userEvent.type(dobInput, "1990-01-01")
    await userEvent.type(cnicInput, "35201-1234567-1")

    // Upload candidate photo
    const file = new File(["test-image-content"], "photo.jpg", {
      type: "image/jpeg",
    })
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await userEvent.upload(fileInput, file)

    // Dismiss upload complete modal
    const doneBtn = await screen.findByRole("button", { name: "Done" })
    await userEvent.click(doneBtn)

    // Submit form
    const submitBtn = screen.getByRole("button", {
      name: /Enrol Candidate \(Save & Continue\)/i,
    })
    await userEvent.click(submitBtn)

    // Expect some error message to appear
    await waitFor(() => {
      expect(
        screen.queryByText(/maximum/i) || screen.queryByText(/quota/i) || screen.queryByText(/limit/i),
      ).toBeVisible()
    })

    // Expect submit button to be disabled
    expect(
      screen.getByRole("button", {
        name: /Enrol Candidate \(Save & Continue\)/i,
      }),
    ).toBeDisabled()
  })
})
