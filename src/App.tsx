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

type AppScreen = 'login' | 'mfa' | 'dashboard' | 'enrollment' | 'assessment' | 'approvals' | 'credentials' | 'devices' | 'settings' | 'notifications' | 'credential-revocation' | 'user-management' | 'record-detail'
type Role = 'trade-tester' | 'center-superintendent' | 'super-admin'
type AuthedScreen = Exclude<AppScreen, 'login' | 'mfa'>

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('login')
  const [role, setRole] = useState<Role>('trade-tester')

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

  if (screen === 'login') {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  if (screen === 'mfa') {
    return <MFAScreen onSuccess={handleMFASuccess} onBack={() => setScreen('login')} />
  }

  const authedScreen = screen as AuthedScreen

  return (
    <Layout
      currentScreen={authedScreen}
      role={role}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {authedScreen === 'dashboard' && (
        <DashboardScreen role={role} onNavigate={s => setScreen(s)} />
      )}
      {authedScreen === 'enrollment' && <EnrollmentScreen />}
      {authedScreen === 'assessment' && <AssessmentScreen />}
      {authedScreen === 'approvals' && <ApprovalsScreen />}
      {authedScreen === 'credentials' && <CredentialsScreen />}
      {authedScreen === 'devices' && <DevicesScreen />}
      {authedScreen === 'settings' && <SettingsScreen role={role} />}
      {authedScreen === 'notifications' && <NotificationsScreen />}
      {authedScreen === 'credential-revocation' && <CredentialRevocationScreen />}
      {authedScreen === 'user-management' && <UserManagementScreen />}
      {authedScreen === 'record-detail' && <CandidateRecordScreen onBack={() => setScreen('dashboard')} userRole={role} />}
    </Layout>
  )
}
