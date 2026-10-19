import { useState } from "react"

import Layout from "./components/Layout"
import LoginScreen from "./screens/LoginScreen"
import MFAScreen from "./screens/MFAScreen"
import DashboardScreen from "./screens/DashboardScreen"
import EnrollmentScreen from "./screens/EnrollmentScreen"
import AssessmentScreen from "./screens/AssessmentScreen"
import ApprovalsScreen from "./screens/ApprovalsScreen"
import CredentialsScreen from "./screens/CredentialsScreen"
import DevicesScreen from "./screens/DevicesScreen"
import SettingsScreen from "./screens/SettingsScreen"
import NotificationsScreen from "./screens/NotificationsScreen"
import CredentialRevocationScreen from "./screens/CredentialRevocationScreen"
import UserManagementScreen from "./screens/UserManagementScreen"
import CandidateRecordScreen from "./screens/CandidateRecordScreen"
import LandingScreen from "./screens/LandingScreen"
import QRScannerScreen from "./screens/QRScannerScreen"
import ManualEntryScreen from "./screens/ManualEntryScreen"
import VerificationResultScreen from "./screens/VerificationResultScreen"
import NavBar from "./components/NavBar"
import Footer from "./components/Footer"
import { BtnPrimary, BtnSecondary } from "./components/Btn"
import { verifyNspCredential } from "./services/publicLedgerVerification"

export type Screen = "landing" | "qr-scanner" | "manual-entry" | "result"
export type VerificationStatus = "verified" | "tampered" | "revoked"

export interface VerificationResult {
  status: VerificationStatus
  credentialId: string
  workerName?: string
  skill?: string
  grade?: string
  issueDate?: string
  centre?: string
  txHash?: string
  timestamp: string
  errorMessage?: string
}

type AppScreen = "login" | "mfa" | "verifier" | "dashboard" | "enrollment" | "assessment" | "approvals" | "credentials" | "devices" | "settings" | "notifications" | "credential-revocation" | "user-management" | "record-detail"

type Role = "trade-tester" | "center-superintendent" | "super-admin"
type AuthedScreen = Exclude<AppScreen, "login" | "mfa" | "verifier">

export default function App() {
  // Preserve this project's current verifier-first entry point.
  const [screen, setScreen] = useState<AppScreen>("verifier")
  const [role, setRole] = useState<Role>("trade-tester")
  const [verifierScreen, setVerifierScreen] = useState<Screen>("landing")
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  )
  const [isVerifying, setIsVerifying] = useState(false)

  function handleLoginSuccess(r: Role) {
    setRole(r)
    setScreen("mfa")
  }

  function handleMFASuccess() {
    setScreen("dashboard")
  }

  function handleLogout() {
    setScreen("login")
  }

  function handleNavigate(s: AuthedScreen) {
    setScreen(s)
  }

  async function handleVerify(credentialId: string) {
    setIsVerifying(true)
    setVerificationError(null)
    const timestamp = new Intl.DateTimeFormat("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date())

    try {
      const result = await verifyNspCredential(credentialId)

      let status: VerificationStatus = "tampered"
      if (result.verified) {
        status = "verified"
      } else if (result.errorMessage?.toLowerCase().includes("revoked")) {
        status = "revoked"
      } else {
        status = "tampered"
      }

      setVerificationResult({
        status,
        credentialId: result.credentialId,
        issueDate: result.issuedAt
          ? new Date(result.issuedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : undefined,
        txHash: result.onChainHash,
        timestamp,
        errorMessage: result.errorMessage,
      })
      setVerifierScreen("result")
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "Unable to verify this credential against the ledger. Try again.",
      )
    } finally {
      setIsVerifying(false)
    }
  }

  if (screen === "verifier") {
    if (verificationError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "#F1F0EA",
          }}
        >
          <NavBar
            breadcrumbs={[
              {
                label: "Verify a Credential",
                onClick: () => {
                  setVerificationError(null)
                  setVerifierScreen("landing")
                },
              },
              { label: "Verification Error" },
            ]}
          />
          <div style={{ background: "#24302E", padding: "40px 32px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <p
                style={{
                  color: "#B08D46",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Verification Service Notice
              </p>
              <h1
                style={{
                  color: "#F1F0EA",
                  fontSize: 28,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                Could not connect to verification node
              </h1>
              <p
                style={{
                  color: "rgba(241,240,234,0.55)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                An issue occurred while attempting to contact the public
                blockchain verification endpoint.
              </p>
            </div>
          </div>
          <div style={{ height: 3, background: "#A6453D", flexShrink: 0 }} />

          <main style={{ flex: 1, padding: "40px 32px 64px" }}>
            <div
              style={{
                maxWidth: 640,
                margin: "0 auto",
                background: "#FFFFFF",
                border: "1px solid #D6D3C6",
                borderLeft: "4px solid #A6453D",
                borderRadius: "0 8px 8px 0",
                padding: "28px",
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#8C3B34",
                  marginBottom: 10,
                }}
              >
                Service Communication Error
              </p>
              <p
                role="alert"
                style={{
                  fontSize: 14,
                  color: "#5C5A50",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                {verificationError}
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <BtnPrimary
                  onClick={() => {
                    setVerificationError(null)
                    setVerifierScreen("manual-entry")
                  }}
                >
                  Try entering ID again
                </BtnPrimary>
                <BtnSecondary
                  onClick={() => {
                    setVerificationError(null)
                    setVerifierScreen("qr-scanner")
                  }}
                >
                  Scan QR code
                </BtnSecondary>
                <BtnSecondary
                  onClick={() => {
                    setVerificationError(null)
                    setVerifierScreen("landing")
                  }}
                >
                  Back to start
                </BtnSecondary>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      )
    }

    if (verifierScreen === "landing") {
      return (
        <LandingScreen
          onManualEntry={() => {
            setVerificationError(null)
            setVerifierScreen("manual-entry")
          }}
          onQRScan={() => {
            setVerificationError(null)
            setVerifierScreen("qr-scanner")
          }}
        />
      )
    }

    if (verifierScreen === "qr-scanner") {
      return (
        <QRScannerScreen
          onBack={() => {
            setVerificationError(null)
            setVerifierScreen("landing")
          }}
          onManualEntry={() => {
            setVerificationError(null)
            setVerifierScreen("manual-entry")
          }}
          onScanSuccess={handleVerify}
        />
      )
    }

    if (verifierScreen === "manual-entry") {
      return (
        <ManualEntryScreen
          onBack={() => {
            setVerificationError(null)
            setVerifierScreen("landing")
          }}
          onQRScan={() => {
            setVerificationError(null)
            setVerifierScreen("qr-scanner")
          }}
          onVerify={handleVerify}
          isLoading={isVerifying}
        />
      )
    }

    if (verifierScreen === "result" && verificationResult) {
      return (
        <VerificationResultScreen
          result={verificationResult}
          onVerifyAnother={() => {
            setVerificationResult(null)
            setVerificationError(null)
            setVerifierScreen("landing")
          }}
        />
      )
    }
  }

  if (screen === "login") return <LoginScreen onSuccess={handleLoginSuccess} />
  if (screen === "mfa")
    return (
      <MFAScreen
        onSuccess={handleMFASuccess}
        onBack={() => setScreen("login")}
      />
    )

  const authedScreen = screen as AuthedScreen
  return (
    <Layout
      currentScreen={authedScreen}
      role={role}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {authedScreen === "dashboard" && (
        <DashboardScreen role={role} onNavigate={(s) => setScreen(s)} />
      )}
      {authedScreen === "enrollment" && <EnrollmentScreen />}
      {authedScreen === "assessment" && <AssessmentScreen />}
      {authedScreen === "approvals" && <ApprovalsScreen />}
      {authedScreen === "credentials" && <CredentialsScreen />}
      {authedScreen === "devices" && <DevicesScreen />}
      {authedScreen === "settings" && <SettingsScreen role={role} />}
      {authedScreen === "notifications" && <NotificationsScreen />}
      {authedScreen === "credential-revocation" && (
        <CredentialRevocationScreen />
      )}
      {authedScreen === "user-management" && <UserManagementScreen />}
      {authedScreen === "record-detail" && (
        <CandidateRecordScreen
          onBack={() => setScreen("dashboard")}
          userRole={role}
        />
      )}
    </Layout>
  )
}
