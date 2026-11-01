import { useState, useEffect } from "react"

import Layout from "./components/Layout"

import LoginScreen from "./screens/LoginScreen"

import MFAScreen from "./screens/MFAScreen"

import BackupCodeScreen from "./screens/BackupCodeScreen"

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

import WorkerWalletScreen from "./screens/WorkerWalletScreen"

import { authStore, AppRole } from "./services/authStore"

import { CandidateRecord, verifyNspCredential } from "./services/api"

import { verifyCertificateOnChain } from "./services/contract"

import { startQueueSync, flushQueue } from "./services/offlineQueue"

// ============================================================

// VERIFIER PORTAL TYPES

// ============================================================

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
// ============================================================

// APP TYPES

// ============================================================

type AppScreen = "login" | "mfa" | "backup-code" | "verifier" | "dashboard" | "enrollment" | "assessment" | "approvals" | "credentials" | "devices" | "settings" | "notifications" | "credential-revocation" | "user-management" | "record-detail"

type AuthedScreen = Exclude<AppScreen, "login" | "mfa" | "backup-code" | "verifier">

// ============================================================

// APP

// ============================================================

export default function App() {
  const [session, setSession] = useState(() => authStore.getState())

  const [screen, setScreen] = useState<AppScreen>(() =>
    authStore.getState().isAuthenticated ? "dashboard" : "login",
  )

  const [loginEmail, setLoginEmail] = useState("tradetester@nsp.com")

  const [loginPassword, setLoginPassword] = useState("")

  const [activePortal, setActivePortal] =
    useState<"issuer" | "verifier" | "wallet">(
      "issuer",
    )

  const [assessmentCandidate, setAssessmentCandidate] =
    useState<CandidateRecord | null>(null)

  // ============================================================

  // VERIFIER PORTAL STATE

  // ============================================================

  const [verifierScreen, setVerifierScreen] = useState<Screen>("landing")

  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null)

  // Offline queue: replay on reconnect and at startup (safe via clientRequestId)

  useEffect(() => startQueueSync(), [])

  // Subscribe to authStore

  useEffect(() => {
    const unsubscribe = authStore.subscribe((newSession) => {
      setSession(newSession)

      if (!newSession.isAuthenticated && activePortal === "issuer") {
        setLoginPassword("")
        setScreen("login")
      }
    })

    return () => unsubscribe()
  }, [activePortal])

  // ============================================================

  // LOGIN FLOW (IP-01 / IP-02)

  // ============================================================

  function handleLoginSuccess(_r: AppRole, email: string, password: string) {
    setLoginEmail(email)

    setLoginPassword(password)

    setScreen("mfa")
  }

  function handleMFASuccess() {
    setScreen("dashboard")
  }

  function handleLogout() {
    void flushQueue() // resume anything paused by an expired token

    setLoginPassword("")

    setScreen("dashboard")
  }

  async function handleLogout() {
    await authStore.logout()

    setScreen("login")
  }

  function handleBackToLogin() {
    setLoginPassword("")
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
  function handleNavigateToAssessment(candidate: CandidateRecord) {
    setAssessmentCandidate(candidate)

    setScreen("assessment")
  }

  // ============================================================

  // VERIFIER PORTAL (VD-01 / VD-02 / VD-03)

  // ============================================================

  async function handleVerify(credentialId: string) {
    const timestamp = new Intl.DateTimeFormat("en-PK", {
      day: "2-digit",

      month: "short",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",

      hour12: true,
    }).format(new Date())

    let trimmed = credentialId.trim()
    if (trimmed.includes("id=")) {
      try {
        const u = new URL(trimmed.startsWith("http") ? trimmed : `https://dummy.com/${trimmed}`)
        const idVal = u.searchParams.get("id")
        if (idVal) trimmed = decodeURIComponent(idVal).trim()
      } catch {}
    }

    // 1. Guide #5 §5: Public on-chain verification endpoint (GET /api/ledger/verify/:credentialId)

    // Zero authentication barrier: directly queries Polygon Amoy view method via backend.

    try {
      const apiResult = await verifyNspCredential(trimmed)

      if (apiResult.verified) {
        const issueDate = apiResult.issuedAt
          ? new Date(apiResult.issuedAt).toLocaleDateString("en-GB", {
              day: "2-digit",

              month: "short",

              year: "numeric",
            })
          : "18 Oct 2026"

        setVerificationResult({
          status: "verified",

          credentialId: apiResult.credentialId || trimmed,

          workerName: "Muhammad Aslam Khan",

          skill: "Electrical Installation & Maintenance",

          grade: "Level 2 (Skilled)",

          issueDate,

          centre: "NADRA Regional Testing Centre, Lahore (Hub-01)",

          txHash:
            apiResult.onChainHash ||
            "0x89abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678",

          timestamp,
        })

        setVerifierScreen("result")

        return
      }
    } catch (apiErr) {
      console.warn("Public verification API note:", apiErr)
    }

    // 2. Fallback simulation (for demo / offline testing when backend is offline)

    const onChain = await verifyCertificateOnChain(trimmed)

    if (onChain.isValid) {
      const issueDate = onChain.issuedAt
        ? new Date(onChain.issuedAt * 1000).toLocaleDateString("en-GB", {
            day: "2-digit",

            month: "short",

            year: "numeric",
          })
        : "18 Oct 2026"

      setVerificationResult({
        status: "verified",

        credentialId:
          trimmed || "urn:uuid:7c9e6679-7425-40de-944b-e07fc1f90ae7",

        workerName: "Muhammad Aslam Khan",

        skill: "Electrical Work, Level 2",

        grade: "Level 2 (Skilled)",

        issueDate,

        centre: "NADRA Regional Centre, Lahore",

        txHash: onChain.dataHash,

        timestamp,
      })
    } else if (trimmed.toUpperCase().startsWith("NSP-T")) {
      setVerificationResult({
        status: "tampered",

        credentialId: trimmed,

        timestamp,
      })
    } else {
      setVerificationResult({
        status: "revoked",

        credentialId: trimmed,

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

    setVerifierScreen("result")
  }

  // ============================================================

  // TOP PORTAL SWITCHER HEADER

  // ============================================================

  const renderPortalSwitcher = () => (
    <div
      style={{
        background: "#1A2322",

        color: "#F1F0EA",

        padding: "6px 24px",

        display: "flex",

        alignItems: "center",

        justifyContent: "space-between",

        fontSize: 12,

        borderBottom: "1px solid rgba(255,255,255,0.1)",

        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            color: "#B08D46",

            fontWeight: 700,

            letterSpacing: "0.05em",

            textTransform: "uppercase",
          }}
        >
          Portal Mode:
        </span>
        <div
          style={{
            display: "flex",

            background: "rgba(255,255,255,0.08)",

            borderRadius: 4,

            padding: 2,
          }}
        >
          <button
            onClick={() => {
              setActivePortal("issuer")

              if (!session.isAuthenticated) {
                setScreen("login")
              } else {
                setScreen("dashboard")
              }
            }}
            style={{
              border: "none",

              background: activePortal === "issuer" ? "#4C7A6E" : "transparent",

              color: "#fff",

              padding: "3px 10px",

              borderRadius: 3,

              fontSize: 11,

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            Issuer Portal (Trade Tester)
          </button>
          <button
            onClick={() => {
              setActivePortal("verifier")

              setVerifierScreen("landing")
            }}
            style={{
              border: "none",

              background:
                activePortal === "verifier" ? "#B08D46" : "transparent",

              color: "#fff",

              padding: "3px 10px",

              borderRadius: 3,

              fontSize: 11,

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            Verifier DApp (On-Chain)
          </button>
          <button
            onClick={() => {
              setActivePortal("wallet")
            }}
            style={{
              border: "none",

              background: activePortal === "wallet" ? "#4C7A6E" : "transparent",

              color: "#fff",

              padding: "3px 10px",

              borderRadius: 3,

              fontSize: 11,

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            Worker Wallet (WW-01 – WW-05)
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {session.isAuthenticated && activePortal === "issuer" && (
          <span style={{ color: "rgba(241,240,234,0.7)", fontSize: 11 }}>
            Logged in: <strong>{session.user?.email}</strong> (Role:{" "}
            {session.user?.role})
          </span>
        )}
        <span style={{ color: "rgba(241,240,234,0.4)", fontSize: 11 }}>
          NAVTTC / NADRA · Integrated Build #2
        </span>
      </div>
    </div>
  )

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
  // ============================================================

  // VERIFIER PORTAL SCREENS

  // ============================================================

  if (activePortal === "verifier") {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {renderPortalSwitcher()}
        {verifierScreen === "landing" && (
          <LandingScreen
            onManualEntry={() => setVerifierScreen("manual-entry")}
            onQRScan={() => setVerifierScreen("qr-scanner")}
          />
        )}
        {verifierScreen === "qr-scanner" && (
          <QRScannerScreen
            onBack={() => setVerifierScreen("landing")}
            onManualEntry={() => setVerifierScreen("manual-entry")}
            onScanSuccess={handleVerify}
          />
        )}
        {verifierScreen === "manual-entry" && (
          <ManualEntryScreen
            onBack={() => setVerifierScreen("landing")}
            onQRScan={() => setVerifierScreen("qr-scanner")}
            onVerify={handleVerify}
          />
        )}
        {verifierScreen === "result" && verificationResult && (
          <VerificationResultScreen
            result={verificationResult}
            onVerifyAnother={() => {
              setVerificationResult(null)

              setVerifierScreen("landing")
            }}
          />
        )}
      </div>
    )
  }

  // ============================================================

  // WORKER MOBILE WALLET (WW-01 – WW-05)

  // ============================================================

  if (activePortal === "wallet") {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {renderPortalSwitcher()}
        <WorkerWalletScreen
          onVerifyInVerifier={(urn) => {
            setActivePortal("verifier")

            handleVerify(urn)
          }}
        />
      </div>
    )
  }

  // ============================================================

  // ISSUER PORTAL LOGIN & MFA SCREENS

  // ============================================================

  // Guard unauthenticated access to protected dashboard & workflows
  if (!session.isAuthenticated) {
    if (screen === "mfa") {
      return (
        <div
          style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          {renderPortalSwitcher()}
          <MFAScreen
            email={loginEmail}
            onSuccess={handleMFASuccess}
            onBack={handleBackToLogin}
            onUseBackupCode={() => setScreen("backup-code")}
          />
        </div>
      )
    }

    if (screen === "backup-code") {
      return (
        <div
          style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
        >
          {renderPortalSwitcher()}
          <BackupCodeScreen
            email={loginEmail}
            password={loginPassword}
            onSuccess={handleMFASuccess}
            onBackToMfa={() => setScreen("mfa")}
            onBackToLogin={handleBackToLogin}
          />
        </div>
      )
    }

    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {renderPortalSwitcher()}
        <LoginScreen onSuccess={handleLoginSuccess} />
      </div>
    )
  }

  // ============================================================

  // ISSUER PORTAL DASHBOARD & WORKFLOWS

  // ============================================================

  const authedScreen = screen as AuthedScreen

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {renderPortalSwitcher()}
      <Layout
        currentScreen={authedScreen}
        role={session.role}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {authedScreen === "dashboard" && (
          <DashboardScreen
            role={session.role}
            onNavigate={(s) => setScreen(s)}
          />
        )}

        {authedScreen === "enrollment" && (
          <EnrollmentScreen
            onNavigateToAssessment={handleNavigateToAssessment}
          />
        )}

        {authedScreen === "assessment" && (
          <AssessmentScreen initialCandidate={assessmentCandidate} />
        )}

        {authedScreen === "approvals" && <ApprovalsScreen />}

        {authedScreen === "credentials" && <CredentialsScreen />}

        {authedScreen === "devices" && <DevicesScreen />}

        {authedScreen === "settings" && <SettingsScreen role={session.role} />}

        {authedScreen === "notifications" && <NotificationsScreen />}

        {authedScreen === "credential-revocation" && (
          <CredentialRevocationScreen />
        )}

        {authedScreen === "user-management" && <UserManagementScreen />}

        {authedScreen === "record-detail" && (
          <CandidateRecordScreen
            onBack={() => setScreen("dashboard")}
            userRole={session.role}
          />
        )}
      </Layout>
    </div>
  )
}
