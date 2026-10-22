import { useState, useEffect } from "react"

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
}

// ============================================================

// APP TYPES

// ============================================================

type AppScreen = "login" | "mfa" | "verifier" | "dashboard" | "enrollment" | "assessment" | "approvals" | "credentials" | "devices" | "settings" | "notifications" | "credential-revocation" | "user-management" | "record-detail"

type AuthedScreen = Exclude<AppScreen, "login" | "mfa" | "verifier">

// ============================================================

// APP

// ============================================================

export default function App() {
  const [session, setSession] = useState(() => authStore.getState())

  const [screen, setScreen] = useState<AppScreen>(() =>
    authStore.getState().isAuthenticated ? "dashboard" : "login",
  )

  const [loginEmail, setLoginEmail] = useState("tradetester@nsp.com")

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
        setScreen("login")
      }
    })

    return () => unsubscribe()
  }, [activePortal])

  // ============================================================

  // LOGIN FLOW (IP-01 / IP-02)

  // ============================================================

  function handleLoginSuccess(_r: AppRole, email: string) {
    setLoginEmail(email)

    setScreen("mfa")
  }

  function handleMFASuccess() {
    void flushQueue() // resume anything paused by an expired token

    setScreen("dashboard")
  }

  function handleLogout() {
    authStore.clearSession()

    setScreen("login")
  }

  function handleNavigate(s: AuthedScreen) {
    setScreen(s)
  }

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

    const trimmed = credentialId.trim()

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
      })
    }

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

  if (screen === "login") {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {renderPortalSwitcher()}
        <LoginScreen onSuccess={handleLoginSuccess} />
      </div>
    )
  }

  if (screen === "mfa") {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        {renderPortalSwitcher()}
        <MFAScreen
          email={loginEmail}
          onSuccess={handleMFASuccess}
          onBack={() => setScreen("login")}
        />
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
