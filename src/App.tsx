import { useState } from 'react'

import Layout from './components/Layout'

import LoginScreen from './screens/LoginScreen'
import MFAScreen from './screens/MFAScreen'
import DashboardScreen from './screens/DashboardScreen'
import EnrollmentScreen from './screens/EnrollmentScreen'
import AssessmentScreen from './screens/AssessmentScreen'
import ApprovalsScreen from './screens/ApprovalsScreen'
import CredentialsScreen from './screens/CredentialsScreen'
import DevicesScreen from './screens/DevicesScreen'
import SettingsScreen from './screens/SettingsScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import CredentialRevocationScreen from './screens/CredentialRevocationScreen'
import UserManagementScreen from './screens/UserManagementScreen'
import CandidateRecordScreen from './screens/CandidateRecordScreen'

import LandingScreen from './screens/LandingScreen'
import QRScannerScreen from './screens/QRScannerScreen'
import ManualEntryScreen from './screens/ManualEntryScreen'
import VerificationResultScreen from './screens/VerificationResultScreen'

// ============================================================
// VERIFIER PORTAL TYPES
// ============================================================

export type Screen =
  | 'landing'
  | 'qr-scanner'
  | 'manual-entry'
  | 'result'

export type VerificationStatus =
  | 'verified'
  | 'tampered'
  | 'revoked'

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
// EXISTING APP TYPES
// ============================================================

type AppScreen =
  | 'login'
  | 'mfa'
  | 'verifier'
  | 'dashboard'
  | 'enrollment'
  | 'assessment'
  | 'approvals'
  | 'credentials'
  | 'devices'
  | 'settings'
  | 'notifications'
  | 'credential-revocation'
  | 'user-management'
  | 'record-detail'

type Role =
  | 'trade-tester'
  | 'center-superintendent'
  | 'super-admin'

type AuthedScreen = Exclude<
  AppScreen,
  'login' | 'mfa' | 'verifier'
>

// ============================================================
// APP
// ============================================================

export default function App() {
  // ============================================================
  // EXISTING ISSUER PORTAL STATE
  // ============================================================

  // TEMPORARY:
  // We start with the Verifier Portal so it can be tested
  // without needing the Issuer Portal login.
  const [screen, setScreen] = useState<AppScreen>('verifier')

  const [role, setRole] = useState<Role>('trade-tester')

  // ============================================================
  // VERIFIER PORTAL STATE
  // ============================================================

  const [verifierScreen, setVerifierScreen] =
    useState<Screen>('landing')

  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null)

  // ============================================================
  // EXISTING LOGIN FLOW
  // ============================================================

  function handleLoginSuccess(r: Role) {
    setRole(r)
    setScreen('mfa')
  }

  function handleMFASuccess() {
    setScreen('dashboard')
  }

  function handleLogout() {
    setScreen('login')
  }

  function handleNavigate(s: AuthedScreen) {
    setScreen(s)
  }

  // ============================================================
  // VERIFIER PORTAL
  // ============================================================

  function handleVerify(credentialId: string) {
    const timestamp = new Intl.DateTimeFormat('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date())

    const id = credentialId.toUpperCase()

    // Tampered credential
    if (id.startsWith('NSP-T')) {
      setVerificationResult({
        status: 'tampered',
        credentialId: id,
        timestamp,
      })
    }

    // Revoked credential
    else if (id.startsWith('NSP-R')) {
      setVerificationResult({
        status: 'revoked',
        credentialId: id,
        timestamp,
      })
    }

    // Verified credential
    else {
      setVerificationResult({
        status: 'verified',
        credentialId: id || 'NSP-004821',
        workerName: 'Muhammad Aslam Khan',
        skill: 'Electrical Work, Level 2',
        grade: 'Pass with Merit',
        issueDate: '14 Mar 2025',
        centre: 'NADRA Regional Centre, Lahore',
        txHash: '0x3a7fc182...e8c84d',
        timestamp,
      })
    }

    setVerifierScreen('result')
  }

  // ============================================================
  // VERIFIER PORTAL SCREENS
  // ============================================================

  if (screen === 'verifier') {
    // Landing
    if (verifierScreen === 'landing') {
      return (
        <LandingScreen
          onManualEntry={() =>
            setVerifierScreen('manual-entry')
          }
          onQRScan={() =>
            setVerifierScreen('qr-scanner')
          }
        />
      )
    }

    // QR Scanner
    if (verifierScreen === 'qr-scanner') {
      return (
        <QRScannerScreen
          onBack={() =>
            setVerifierScreen('landing')
          }
          onManualEntry={() =>
            setVerifierScreen('manual-entry')
          }
          onScanSuccess={handleVerify}
        />
      )
    }

    // Manual Entry
    if (verifierScreen === 'manual-entry') {
      return (
        <ManualEntryScreen
          onBack={() =>
            setVerifierScreen('landing')
          }
          onQRScan={() =>
            setVerifierScreen('qr-scanner')
          }
          onVerify={handleVerify}
        />
      )
    }

    // Verification Result
    if (
      verifierScreen === 'result' &&
      verificationResult
    ) {
      return (
        <VerificationResultScreen
          result={verificationResult}
          onVerifyAnother={() => {
            setVerificationResult(null)
            setVerifierScreen('landing')
          }}
        />
      )
    }
  }

  // ============================================================
  // EXISTING LOGIN
  // ============================================================

  if (screen === 'login') {
    return (
      <LoginScreen
        onSuccess={handleLoginSuccess}
      />
    )
  }

  // ============================================================
  // EXISTING MFA
  // ============================================================

  if (screen === 'mfa') {
    return (
      <MFAScreen
        onSuccess={handleMFASuccess}
        onBack={() => setScreen('login')}
      />
    )
  }

  // ============================================================
  // EXISTING ISSUER PORTAL
  // ============================================================

  const authedScreen = screen as AuthedScreen

  return (
    <Layout
      currentScreen={authedScreen}
      role={role}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {authedScreen === 'dashboard' && (
        <DashboardScreen
          role={role}
          onNavigate={s => setScreen(s)}
        />
      )}

      {authedScreen === 'enrollment' && (
        <EnrollmentScreen />
      )}

      {authedScreen === 'assessment' && (
        <AssessmentScreen />
      )}

      {authedScreen === 'approvals' && (
        <ApprovalsScreen />
      )}

      {authedScreen === 'credentials' && (
        <CredentialsScreen />
      )}

      {authedScreen === 'devices' && (
        <DevicesScreen />
      )}

      {authedScreen === 'settings' && (
        <SettingsScreen role={role} />
      )}

      {authedScreen === 'notifications' && (
        <NotificationsScreen />
      )}

      {authedScreen === 'credential-revocation' && (
        <CredentialRevocationScreen />
      )}

      {authedScreen === 'user-management' && (
        <UserManagementScreen />
      )}

      {authedScreen === 'record-detail' && (
        <CandidateRecordScreen
          onBack={() => setScreen('dashboard')}
          userRole={role}
        />
      )}
    </Layout>
  )
}