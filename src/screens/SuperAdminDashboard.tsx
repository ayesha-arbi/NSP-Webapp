import { useState, useMemo } from "react"
import Select from "@/components/Select"

/* ── Types ── */
type Tab = "overview" | "hubs" | "minting" | "devices" | "audit"
type MintStatus = "queued" | "minting" | "confirmed" | "failed"
type HubStatus = "on-track" | "behind" | "critical"
type DeviceStatus = "online" | "offline" | "degraded"
type AuditCategory = "auth" | "approval" | "mint" | "credential" | "device" | "admin" | "assessment"
type UserRole = "trade-tester" | "center-superintendent" | "super-admin" | "system"

interface Hub {
  id: string
  name: string
  enrolled: number
  target: number
  submitted: number
  pendingApproval: number
  minted: number
  status: HubStatus
}

interface MintTx {
  id: string
  credId: string
  assessId: string
  candidate: string
  hub: string
  status: MintStatus
  retryCount: number
  failReason?: string
  txHash?: string
  lastUpdated: string
  submittedAt: string
}

interface DeviceHub {
  hubId: string
  hubName: string
  deviceStatus: DeviceStatus
  connectivity: string
  lastConnected: string
  deviceHealth: "good" | "degraded" | "critical"
  edrStatus: "active" | "inactive" | "warning"
  lastSync: string
  offlineRecords: number
}

interface AuditEntry {
  id: string
  action: string
  user: string
  hub: string
  timestamp: string
  result: "success" | "failure" | "warning"
  category: AuditCategory
  detail?: string
}

interface FullAuditEntry {
  id: string
  timestamp: string
  eventType: string
  category: AuditCategory
  user: string
  userRole: UserRole
  hub: string
  targetId?: string
  targetType?: "credential" | "assessment" | "user" | "session" | "device"
  ip?: string
  device?: string
  result: "success" | "failure" | "warning"
  detail: string
  metadata?: Record<string, string>
}

/* ── Static data ── */
const HUBS: Hub[] = [
  {
    id: "LAH-C01",
    name: "Lahore-C01",
    enrolled: 47,
    target: 60,
    submitted: 38,
    pendingApproval: 9,
    minted: 31,
    status: "on-track",
  },
  {
    id: "KHI-C02",
    name: "Karachi-C02",
    enrolled: 53,
    target: 60,
    submitted: 48,
    pendingApproval: 5,
    minted: 45,
    status: "on-track",
  },
  {
    id: "ISB-C03",
    name: "Islamabad-C03",
    enrolled: 29,
    target: 60,
    submitted: 22,
    pendingApproval: 7,
    minted: 18,
    status: "behind",
  },
  {
    id: "PSH-C04",
    name: "Peshawar-C04",
    enrolled: 12,
    target: 60,
    submitted: 8,
    pendingApproval: 4,
    minted: 6,
    status: "critical",
  },
  {
    id: "QTA-C05",
    name: "Quetta-C05",
    enrolled: 38,
    target: 60,
    submitted: 31,
    pendingApproval: 7,
    minted: 28,
    status: "on-track",
  },
]

const INIT_MINT_TXS: MintTx[] = [
  {
    id: "Q1",
    credId: "CRED-2026-00094",
    assessId: "ASS-2026-00501",
    candidate: "Nadia Arshad",
    hub: "Karachi-C02",
    status: "queued",
    retryCount: 0,
    lastUpdated: "10:52",
    submittedAt: "10:51",
  },
  {
    id: "Q2",
    credId: "CRED-2026-00093",
    assessId: "ASS-2026-00500",
    candidate: "Bilal Chaudhry",
    hub: "Lahore-C01",
    status: "queued",
    retryCount: 0,
    lastUpdated: "10:48",
    submittedAt: "10:47",
  },
  {
    id: "M1",
    credId: "CRED-2026-00092",
    assessId: "ASS-2026-00499",
    candidate: "Ayesha Tariq",
    hub: "Quetta-C05",
    status: "minting",
    retryCount: 0,
    lastUpdated: "10:50",
    submittedAt: "10:46",
  },
  {
    id: "M2",
    credId: "CRED-2026-00091",
    assessId: "ASS-2026-00498",
    candidate: "Usman Qureshi",
    hub: "Karachi-C02",
    status: "minting",
    retryCount: 0,
    lastUpdated: "10:49",
    submittedAt: "10:45",
  },
  {
    id: "C1",
    credId: "CRED-2026-00090",
    assessId: "ASS-2026-00497",
    candidate: "Sadia Malik",
    hub: "Lahore-C01",
    status: "confirmed",
    retryCount: 0,
    txHash: "0x8f2a1c4e6b0d3f9a2c7e5b1d4f8a0c3e",
    lastUpdated: "09:41",
    submittedAt: "09:38",
  },
  {
    id: "C2",
    credId: "CRED-2026-00089",
    assessId: "ASS-2026-00496",
    candidate: "Tariq Mehmood",
    hub: "Lahore-C01",
    status: "confirmed",
    retryCount: 0,
    txHash: "0x1a3c5e7b9d0f2a4c6e8b0d2f4a6c8e0a",
    lastUpdated: "09:22",
    submittedAt: "09:19",
  },
  {
    id: "C3",
    credId: "CRED-2026-00088",
    assessId: "ASS-2026-00495",
    candidate: "Rabia Qureshi",
    hub: "Islamabad-C03",
    status: "confirmed",
    retryCount: 0,
    txHash: "0x4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a",
    lastUpdated: "08:55",
    submittedAt: "08:53",
  },
  {
    id: "F1",
    credId: "CRED-2026-00087",
    assessId: "ASS-2026-00494",
    candidate: "Imran Gul",
    hub: "Peshawar-C04",
    status: "failed",
    retryCount: 3,
    failReason: "Node timeout — smart contract call failed after 3 retries.",
    lastUpdated: "07:18",
    submittedAt: "06:50",
  },
  {
    id: "F2",
    credId: "CRED-2026-00086",
    assessId: "ASS-2026-00493",
    candidate: "Amna Siddiqui",
    hub: "Karachi-C02",
    status: "failed",
    retryCount: 2,
    failReason: "Gas estimation failed — network congestion.",
    lastUpdated: "07:05",
    submittedAt: "06:40",
  },
  {
    id: "F3",
    credId: "CRED-2026-00085",
    assessId: "ASS-2026-00492",
    candidate: "Zafar Iqbal",
    hub: "Quetta-C05",
    status: "failed",
    retryCount: 1,
    failReason: "Smart contract revert: invalid CID format.",
    lastUpdated: "06:44",
    submittedAt: "06:20",
  },
  {
    id: "F4",
    credId: "CRED-2026-00084",
    assessId: "ASS-2026-00491",
    candidate: "Usman Bhatti",
    hub: "Islamabad-C03",
    status: "failed",
    retryCount: 0,
    failReason: "Insufficient gas limit — transaction dropped from mempool.",
    lastUpdated: "05:30",
    submittedAt: "05:28",
  },
]

const DEVICES: DeviceHub[] = [
  {
    hubId: "LAH-C01",
    hubName: "Lahore-C01",
    deviceStatus: "online",
    connectivity: "4G LTE",
    lastConnected: "Active now",
    deviceHealth: "good",
    edrStatus: "active",
    lastSync: "5 min ago",
    offlineRecords: 0,
  },
  {
    hubId: "KHI-C02",
    hubName: "Karachi-C02",
    deviceStatus: "online",
    connectivity: "WiFi",
    lastConnected: "Active now",
    deviceHealth: "good",
    edrStatus: "active",
    lastSync: "12 min ago",
    offlineRecords: 2,
  },
  {
    hubId: "ISB-C03",
    hubName: "Islamabad-C03",
    deviceStatus: "online",
    connectivity: "4G LTE",
    lastConnected: "Active now",
    deviceHealth: "good",
    edrStatus: "active",
    lastSync: "1 hr ago",
    offlineRecords: 0,
  },
  {
    hubId: "PSH-C04",
    hubName: "Peshawar-C04",
    deviceStatus: "offline",
    connectivity: "None",
    lastConnected: "3 hrs ago",
    deviceHealth: "critical",
    edrStatus: "inactive",
    lastSync: "4 hrs ago",
    offlineRecords: 7,
  },
  {
    hubId: "QTA-C05",
    hubName: "Quetta-C05",
    deviceStatus: "degraded",
    connectivity: "3G",
    lastConnected: "2 min ago",
    deviceHealth: "degraded",
    edrStatus: "warning",
    lastSync: "2 hrs ago",
    offlineRecords: 0,
  },
]

const AUDIT_LOG: AuditEntry[] = [
  {
    id: "a01",
    action: "Manual mint retry initiated",
    user: "Zara Khan",
    hub: "Peshawar-C04",
    timestamp: "2026-08-27 10:44",
    result: "success",
    category: "mint",
    detail: "CRED-2026-00087 queued for retry",
  },
  {
    id: "a02",
    action: "Credential revoked",
    user: "Zara Khan",
    hub: "Karachi-C02",
    timestamp: "2026-08-27 10:31",
    result: "success",
    category: "credential",
    detail: "CRED-2026-00072 — trade mismatch",
  },
  {
    id: "a03",
    action: "MFA step-up verified",
    user: "Zara Khan",
    hub: "—",
    timestamp: "2026-08-27 10:30",
    result: "success",
    category: "auth",
    detail: "Action: Credential revocation",
  },
  {
    id: "a04",
    action: "Login — Super Admin",
    user: "Zara Khan",
    hub: "—",
    timestamp: "2026-08-27 09:58",
    result: "success",
    category: "auth",
    detail: "Chrome 126 · 203.128.22.14",
  },
  {
    id: "a05",
    action: "Assessment approved",
    user: "Fatima Malik",
    hub: "Lahore-C01",
    timestamp: "2026-08-27 09:41",
    result: "success",
    category: "approval",
    detail: "ASS-2026-00497 · Score 91",
  },
  {
    id: "a06",
    action: "Mint transaction failed",
    user: "System",
    hub: "Islamabad-C03",
    timestamp: "2026-08-27 09:18",
    result: "failure",
    category: "mint",
    detail: "CRED-2026-00084 · Retry #0",
  },
  {
    id: "a07",
    action: "Assessment rejected",
    user: "Fatima Malik",
    hub: "Lahore-C01",
    timestamp: "2026-08-27 08:55",
    result: "warning",
    category: "approval",
    detail: "ASS-2026-00492 — below threshold",
  },
  {
    id: "a08",
    action: "Device went offline",
    user: "System",
    hub: "Peshawar-C04",
    timestamp: "2026-08-27 07:55",
    result: "failure",
    category: "device",
    detail: "No connectivity for 3+ hrs",
  },
  {
    id: "a09",
    action: "Credential minted",
    user: "System",
    hub: "Lahore-C01",
    timestamp: "2026-08-27 07:41",
    result: "success",
    category: "mint",
    detail: "CRED-2026-00090 · Block #4821203",
  },
  {
    id: "a10",
    action: "Session revoked",
    user: "Zara Khan",
    hub: "—",
    timestamp: "2026-08-26 18:22",
    result: "success",
    category: "auth",
    detail: "Ahmad Raza · Safari iOS",
  },
  {
    id: "a11",
    action: "Login failed — wrong password",
    user: "Ahmad Raza",
    hub: "Lahore-C01",
    timestamp: "2026-08-26 17:44",
    result: "failure",
    category: "auth",
    detail: "Attempt 2/5 · 203.128.22.14",
  },
  {
    id: "a12",
    action: "Offline records synced",
    user: "System",
    hub: "Karachi-C02",
    timestamp: "2026-08-26 17:30",
    result: "success",
    category: "device",
    detail: "3 enrollment records uploaded",
  },
  {
    id: "a13",
    action: "Assessment approved",
    user: "Ali Hassan",
    hub: "Karachi-C02",
    timestamp: "2026-08-26 16:58",
    result: "success",
    category: "approval",
    detail: "ASS-2026-00488 · Score 78",
  },
  {
    id: "a14",
    action: "Credential minted",
    user: "System",
    hub: "Karachi-C02",
    timestamp: "2026-08-26 16:45",
    result: "success",
    category: "mint",
    detail: "CRED-2026-00083 · Block #4821101",
  },
  {
    id: "a15",
    action: "MFA step-up failed",
    user: "Zara Khan",
    hub: "—",
    timestamp: "2026-08-26 15:10",
    result: "failure",
    category: "auth",
    detail: "Wrong OTP — retry allowed",
  },
]

const FULL_AUDIT_LOG: FullAuditEntry[] = [
  /* ── Auth ── */
  {
    id: "f01",
    timestamp: "2026-08-27 10:44:18",
    eventType: "Login — Success",
    category: "auth",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Super Admin authenticated successfully",
    metadata: { "Session ID": "sess_zk_8820", "MFA Method": "TOTP" },
  },
  {
    id: "f02",
    timestamp: "2026-08-27 10:30:11",
    eventType: "MFA Step-Up Challenge",
    category: "auth",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Step-up MFA verified for credential revocation",
    metadata: { Action: "Credential Revocation", Target: "CRED-2026-00072" },
  },
  {
    id: "f03",
    timestamp: "2026-08-27 09:58:12",
    eventType: "Login — Success",
    category: "auth",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Session established",
    metadata: { "Session ID": "sess_zk_8815", "MFA Method": "TOTP" },
  },
  {
    id: "f04",
    timestamp: "2026-08-27 09:55:33",
    eventType: "Login — Success",
    category: "auth",
    user: "Ahmad Raza",
    userRole: "trade-tester",
    hub: "Lahore-C01",
    ip: "203.128.22.14",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Trade Tester authenticated",
    metadata: { "Session ID": "sess_ar_4401", "MFA Method": "TOTP" },
  },
  {
    id: "f05",
    timestamp: "2026-08-27 08:30:04",
    eventType: "Login — Success",
    category: "auth",
    user: "Fatima Malik",
    userRole: "center-superintendent",
    hub: "Lahore-C01",
    ip: "203.128.22.15",
    device: "Edge 126 · Windows 10",
    result: "success",
    detail: "Center Superintendent authenticated",
    metadata: { "Session ID": "sess_fm_3302", "MFA Method": "TOTP" },
  },
  {
    id: "f06",
    timestamp: "2026-08-27 07:30:18",
    eventType: "Login — Success",
    category: "auth",
    user: "Bilal Ahmed",
    userRole: "trade-tester",
    hub: "Karachi-C02",
    ip: "42.201.64.88",
    device: "Chrome 126 · macOS",
    result: "success",
    detail: "Trade Tester authenticated",
    metadata: { "Session ID": "sess_ba_2211" },
  },
  {
    id: "f07",
    timestamp: "2026-08-27 07:15:40",
    eventType: "Login — MFA Failed",
    category: "auth",
    user: "Sana Malik",
    userRole: "trade-tester",
    hub: "Islamabad-C03",
    ip: "119.155.30.44",
    device: "Firefox 128 · Ubuntu",
    result: "failure",
    detail: "Wrong OTP entered — 1 attempt remaining",
    metadata: { "Failed Attempt": "4/5", "Lockout Threshold": "5" },
  },
  {
    id: "f08",
    timestamp: "2026-08-26 18:22:00",
    eventType: "Session Force-Revoked",
    category: "auth",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Ahmad Raza's session invalidated by administrator",
    targetId: "sess_ar_4395",
    targetType: "session",
    metadata: {
      "Revoked Session": "sess_ar_4395",
      Device: "Safari · iOS 17",
      Reason: "Suspicious activity reported",
    },
  },
  {
    id: "f09",
    timestamp: "2026-08-26 17:44:02",
    eventType: "Login — Wrong Password",
    category: "auth",
    user: "Ahmad Raza",
    userRole: "trade-tester",
    hub: "Lahore-C01",
    ip: "203.128.22.14",
    device: "Chrome 126 · Windows 11",
    result: "failure",
    detail: "Failed login attempt 2 of 5",
    metadata: { Attempt: "2/5", "Account Status": "Active" },
  },
  {
    id: "f10",
    timestamp: "2026-08-26 15:10:05",
    eventType: "MFA Step-Up Failed",
    category: "auth",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "failure",
    detail: "Wrong OTP entered — retry allowed",
    metadata: {
      "Action Attempted": "Credential Revocation",
      "Retry Remaining": "Yes",
    },
  },
  {
    id: "f11",
    timestamp: "2026-08-25 14:10:33",
    eventType: "Login — Wrong Password",
    category: "auth",
    user: "Khalid Mehmood",
    userRole: "trade-tester",
    hub: "Peshawar-C04",
    ip: "103.22.88.7",
    device: "Chrome 126 · Windows 10",
    result: "failure",
    detail: "Failed login attempt 5 of 5 — account locked",
    metadata: { Attempt: "5/5", "Account Status": "Locked" },
  },
  {
    id: "f12",
    timestamp: "2026-08-20 11:45:00",
    eventType: "MFA Reset — Assisted",
    category: "auth",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "MFA cleared for Ali Hassan — must re-enroll on next login",
    targetId: "ali.hassan@navttc.gov.pk",
    targetType: "user",
    metadata: {
      "Affected User": "Ali Hassan",
      Reason: "Lost access to authenticator app",
      "Out-of-Band Verified": "Yes",
    },
  },

  /* ── Admin ── */
  {
    id: "f13",
    timestamp: "2026-08-25 14:15:00",
    eventType: "Account Locked — Auto",
    category: "admin",
    user: "System",
    userRole: "system",
    hub: "Peshawar-C04",
    result: "success",
    detail: "Account locked after 5 consecutive failed login attempts",
    targetId: "khalid.mehmood@navttc.gov.pk",
    targetType: "user",
    metadata: {
      "Affected User": "Khalid Mehmood",
      "Failed Attempts": "5",
      "Lock Trigger": "Automatic (policy)",
    },
  },
  {
    id: "f14",
    timestamp: "2026-08-24 09:30:00",
    eventType: "Account Locked — Manual",
    category: "admin",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Raheela Qasim locked pending identity re-verification",
    targetId: "raheela.qasim@navttc.gov.pk",
    targetType: "user",
    metadata: {
      "Affected User": "Raheela Qasim",
      Reason: "Pending identity re-verification",
    },
  },
  {
    id: "f15",
    timestamp: "2026-08-19 09:15:00",
    eventType: "Account Unlocked",
    category: "admin",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Account re-enabled after successful identity verification",
    targetId: "usman.tariq@navttc.gov.pk",
    targetType: "user",
    metadata: { "Affected User": "Usman Tariq", "Previous Lock By": "System" },
  },
  {
    id: "f16",
    timestamp: "2026-03-01 11:00:00",
    eventType: "User Account Created",
    category: "admin",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 124 · Windows 11",
    result: "success",
    detail: "New Trade Tester account provisioned for Quetta-C05",
    targetId: "raheela.qasim@navttc.gov.pk",
    targetType: "user",
    metadata: {
      "New User": "Raheela Qasim",
      "Role Assigned": "Trade Tester",
      Hub: "Quetta-C05",
      "MFA Required": "Yes",
    },
  },
  {
    id: "f17",
    timestamp: "2026-02-14 10:00:00",
    eventType: "User Account Created",
    category: "admin",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 122 · Windows 11",
    result: "success",
    detail: "New Trade Tester account provisioned for Quetta-C05",
    targetId: "nadia.hussain@navttc.gov.pk",
    targetType: "user",
    metadata: {
      "New User": "Nadia Hussain",
      "Role Assigned": "Trade Tester",
      Hub: "Quetta-C05",
      "MFA Required": "Yes",
    },
  },
  {
    id: "f18",
    timestamp: "2026-02-10 14:30:00",
    eventType: "User Role Changed",
    category: "admin",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "—",
    ip: "203.128.22.20",
    device: "Chrome 122 · Windows 11",
    result: "success",
    detail: "Khalid Mehmood hub assignment updated",
    targetId: "khalid.mehmood@navttc.gov.pk",
    targetType: "user",
    metadata: {
      "Affected User": "Khalid Mehmood",
      "Previous Hub": "Lahore-C01",
      "New Hub": "Peshawar-C04",
      Role: "Trade Tester",
    },
  },

  /* ── Assessment ── */
  {
    id: "f19",
    timestamp: "2026-08-27 10:30:00",
    eventType: "Assessment Submitted",
    category: "assessment",
    user: "Ahmad Raza",
    userRole: "trade-tester",
    hub: "Lahore-C01",
    ip: "203.128.22.14",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Assessment scores submitted for candidate Nadia Arshad",
    targetId: "ASS-2026-00501",
    targetType: "assessment",
    metadata: {
      Candidate: "Nadia Arshad",
      Trade: "Electrical Wiring",
      Score: "88",
      "Offline Mode": "No",
    },
  },
  {
    id: "f20",
    timestamp: "2026-08-27 10:25:00",
    eventType: "Assessment Submitted",
    category: "assessment",
    user: "Bilal Ahmed",
    userRole: "trade-tester",
    hub: "Karachi-C02",
    ip: "42.201.64.88",
    device: "Chrome 126 · macOS",
    result: "success",
    detail: "Assessment scores submitted for candidate Bilal Chaudhry",
    targetId: "ASS-2026-00500",
    targetType: "assessment",
    metadata: {
      Candidate: "Bilal Chaudhry",
      Trade: "Plumbing",
      Score: "74",
      "Offline Mode": "No",
    },
  },
  {
    id: "f21",
    timestamp: "2026-08-27 09:55:00",
    eventType: "Assessment Submitted",
    category: "assessment",
    user: "Sana Malik",
    userRole: "trade-tester",
    hub: "Islamabad-C03",
    ip: "119.155.30.44",
    device: "Firefox 128 · Ubuntu",
    result: "success",
    detail: "Assessment scores submitted — offline sync on connect",
    targetId: "ASS-2026-00499",
    targetType: "assessment",
    metadata: {
      Candidate: "Ayesha Tariq",
      Trade: "Masonry",
      Score: "95",
      "Offline Mode": "Yes",
    },
  },

  /* ── Approval ── */
  {
    id: "f22",
    timestamp: "2026-08-27 09:41:00",
    eventType: "Assessment Approved",
    category: "approval",
    user: "Fatima Malik",
    userRole: "center-superintendent",
    hub: "Lahore-C01",
    ip: "203.128.22.15",
    device: "Edge 126 · Windows 10",
    result: "success",
    detail: "Assessment approved and queued for minting",
    targetId: "ASS-2026-00497",
    targetType: "assessment",
    metadata: {
      Candidate: "Sadia Malik",
      Score: "91",
      Grade: "Distinction",
      "Mint Status": "Queued",
    },
  },
  {
    id: "f23",
    timestamp: "2026-08-27 08:55:00",
    eventType: "Assessment Rejected",
    category: "approval",
    user: "Fatima Malik",
    userRole: "center-superintendent",
    hub: "Lahore-C01",
    ip: "203.128.22.15",
    device: "Edge 126 · Windows 10",
    result: "warning",
    detail: "Score below passing threshold — assessment rejected",
    targetId: "ASS-2026-00492",
    targetType: "assessment",
    metadata: {
      Candidate: "Zafar Iqbal",
      Score: "41",
      Threshold: "50",
      Reason: "Below passing threshold",
    },
  },
  {
    id: "f24",
    timestamp: "2026-08-26 16:58:00",
    eventType: "Assessment Approved",
    category: "approval",
    user: "Ali Hassan",
    userRole: "center-superintendent",
    hub: "Karachi-C02",
    ip: "42.201.64.90",
    device: "Chrome 126 · Windows 10",
    result: "success",
    detail: "Assessment approved and queued for minting",
    targetId: "ASS-2026-00488",
    targetType: "assessment",
    metadata: {
      Candidate: "Amna Siddiqui",
      Score: "78",
      Grade: "Pass",
      "Mint Status": "Queued",
    },
  },
  {
    id: "f25",
    timestamp: "2026-08-26 14:20:00",
    eventType: "Assessment Approved",
    category: "approval",
    user: "Usman Tariq",
    userRole: "center-superintendent",
    hub: "Islamabad-C03",
    ip: "119.155.30.50",
    device: "Chrome 126 · Windows 10",
    result: "success",
    detail: "Assessment approved and queued for minting",
    targetId: "ASS-2026-00495",
    targetType: "assessment",
    metadata: {
      Candidate: "Rabia Qureshi",
      Score: "85",
      Grade: "Pass",
      "Mint Status": "Queued",
    },
  },

  /* ── Minting ── */
  {
    id: "f26",
    timestamp: "2026-08-27 10:44:00",
    eventType: "Mint Retry Initiated",
    category: "mint",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "Peshawar-C04",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Failed transaction re-queued after step-up MFA",
    targetId: "CRED-2026-00087",
    targetType: "credential",
    metadata: {
      "Previous Retries": "3",
      "Failure Reason": "Node timeout — smart contract call failed",
      "Queue Position": "3",
    },
  },
  {
    id: "f27",
    timestamp: "2026-08-27 09:18:00",
    eventType: "Mint Transaction Failed",
    category: "mint",
    user: "System",
    userRole: "system",
    hub: "Islamabad-C03",
    result: "failure",
    detail: "Insufficient gas — transaction dropped from mempool",
    targetId: "CRED-2026-00084",
    targetType: "credential",
    metadata: {
      "Retry Count": "0",
      Error: "Insufficient gas limit — transaction dropped from mempool",
      "Tx Hash": "Not available",
    },
  },
  {
    id: "f28",
    timestamp: "2026-08-27 07:18:00",
    eventType: "Mint Transaction Failed",
    category: "mint",
    user: "System",
    userRole: "system",
    hub: "Peshawar-C04",
    result: "failure",
    detail: "Node timeout after 3 retries — manual intervention required",
    targetId: "CRED-2026-00087",
    targetType: "credential",
    metadata: {
      "Retry Count": "3",
      Error: "Node timeout — smart contract call failed",
      "Escalation Status": "Pending",
    },
  },
  {
    id: "f29",
    timestamp: "2026-08-27 07:41:00",
    eventType: "Credential Minted",
    category: "mint",
    user: "System",
    userRole: "system",
    hub: "Lahore-C01",
    result: "success",
    detail: "Credential confirmed on-chain",
    targetId: "CRED-2026-00090",
    targetType: "credential",
    metadata: {
      "Block Number": "4821203",
      "Tx Hash": "0x8f2a1c4e6b0d3f9a2c7e5b1d4f8a0c3e",
      "Gas Used": "142,400",
      Candidate: "Sadia Malik",
    },
  },
  {
    id: "f30",
    timestamp: "2026-08-26 16:45:00",
    eventType: "Credential Minted",
    category: "mint",
    user: "System",
    userRole: "system",
    hub: "Karachi-C02",
    result: "success",
    detail: "Credential confirmed on-chain",
    targetId: "CRED-2026-00083",
    targetType: "credential",
    metadata: {
      "Block Number": "4821101",
      "Tx Hash": "0x1a3c5e7b9d0f2a4c6e8b0d2f4a6c8e0a",
      "Gas Used": "138,700",
      Candidate: "Tariq Mehmood",
    },
  },
  {
    id: "f31",
    timestamp: "2026-08-26 07:05:00",
    eventType: "Mint Transaction Failed",
    category: "mint",
    user: "System",
    userRole: "system",
    hub: "Karachi-C02",
    result: "failure",
    detail: "Gas estimation failed due to network congestion",
    targetId: "CRED-2026-00086",
    targetType: "credential",
    metadata: {
      "Retry Count": "2",
      Error: "Gas estimation failed — network congestion",
      Candidate: "Amna Siddiqui",
    },
  },

  /* ── Credential ── */
  {
    id: "f32",
    timestamp: "2026-08-27 10:31:00",
    eventType: "Credential Revoked",
    category: "credential",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "Karachi-C02",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Credential revoked — incorrect trade classification",
    targetId: "CRED-2026-00072",
    targetType: "credential",
    metadata: {
      Candidate: "Faisal Akhtar",
      Reason: "Incorrect trade classification recorded at time of assessment",
      "Revocation Block": "4821289",
    },
  },
  {
    id: "f33",
    timestamp: "2026-08-15 14:20:00",
    eventType: "Credential Revoked",
    category: "credential",
    user: "Zara Khan",
    userRole: "super-admin",
    hub: "Islamabad-C03",
    ip: "203.128.22.20",
    device: "Chrome 126 · Windows 11",
    result: "success",
    detail: "Credential revoked — test fraud investigation",
    targetId: "CRED-2026-00055",
    targetType: "credential",
    metadata: {
      Candidate: "Tariq Bhatti",
      Reason: "Test fraud — unauthorized materials found during assessment",
      "Case Reference": "FRAUD-2026-003",
    },
  },

  /* ── Device ── */
  {
    id: "f34",
    timestamp: "2026-08-27 07:55:00",
    eventType: "Device Went Offline",
    category: "device",
    user: "System",
    userRole: "system",
    hub: "Peshawar-C04",
    result: "failure",
    detail: "Hub device lost connectivity — 7 offline records pending sync",
    metadata: {
      "Last Connected": "3 hrs ago",
      "Offline Records": "7",
      "EDR Status": "Inactive",
    },
  },
  {
    id: "f35",
    timestamp: "2026-08-26 17:30:00",
    eventType: "Offline Records Synced",
    category: "device",
    user: "System",
    userRole: "system",
    hub: "Karachi-C02",
    result: "success",
    detail: "3 enrollment records uploaded after reconnection",
    metadata: {
      "Records Synced": "3",
      "Sync Duration": "2.1s",
      Conflicts: "None",
    },
  },
]

/* ── Helpers ── */
function hubStatusColor(s: HubStatus) {
  return s === "on-track" ? "#4C7A6E" : s === "behind" ? "#8C6F35" : "#A6453D"
}

function renderHubPill(s: HubStatus) {
  if (s === "on-track")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 32,
          padding: "0 12px 0 6px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          background: "#DCE7E3",
          color: "#2F5C4E",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="10" cy="10" r="8" fill="#4C7A6E" />
          <path
            d="M6 10 L9 13 L14 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>{" "}
        On Track
      </span>
    )
  if (s === "behind")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 32,
          padding: "0 12px 0 6px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          background: "#F1E7D2",
          color: "#8C6F35",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
          <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
        </svg>{" "}
        Behind
      </span>
    )
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px 0 6px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        background: "#EFE3C9",
        color: "#9C6B1F",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <circle cx="10" cy="10" r="8" fill="#B08D46" />
        <path
          d="M10 5 L10 11 M10 14 L10 15"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>{" "}
      Critical
    </span>
  )
}
function renderMintPill(s: MintStatus) {
  if (s === "confirmed")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 32,
          padding: "0 12px 0 6px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          background: "#DCE7E3",
          color: "#2F5C4E",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="10" cy="10" r="8" fill="#4C7A6E" />
          <path
            d="M6 10 L9 13 L14 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>{" "}
        Confirmed
      </span>
    )
  if (s === "failed")
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 32,
          padding: "0 12px 0 6px",
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "Inter, sans-serif",
          background: "#EFE3C9",
          color: "#9C6B1F",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="10" cy="10" r="8" fill="#B08D46" />
          <path
            d="M10 5 L10 11 M10 14 L10 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>{" "}
        Failed
      </span>
    )
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px 0 6px",
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        background: "#F1E7D2",
        color: "#8C6F35",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <circle cx="10" cy="10" r="7" stroke="#B08D46" strokeWidth="1.5" />
        <path d="M10 3 A7 7 0 0 1 17 10 L10 10 Z" fill="#B08D46" />
      </svg>{" "}
      {s === "minting" ? "Minting…" : "Queued"}
    </span>
  )
}
function auditColor(r: AuditEntry["result"]) {
  return r === "success" ? "#4C7A6E" : r === "failure" ? "#A6453D" : "#B08D46"
}
function auditBg(r: AuditEntry["result"]) {
  return r === "success" ? "#EAF3DE" : r === "failure" ? "#FCEBEB" : "#FCE8D6"
}

const PILL: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0 12px",
  height: 32,
  background: "#E4E2D9",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "Inter, sans-serif",
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #D6D3C6",
        borderRadius: 8,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          padding: "14px 24px",
          borderBottom: "1px solid #D6D3C6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#24302E",
            margin: 0,
            letterSpacing: -0.1,
          }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(36,48,46,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #D6D3C6",
          borderRadius: 8,
          padding: 32,
          maxWidth: 520,
          width: "100%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview")
  const [txs, setTxs] = useState<MintTx[]>(INIT_MINT_TXS)
  const [selectedTx, setSelectedTx] = useState<MintTx | null>(null)
  const [modal, setModal] = useState<"none" | "intervene" | "mfa">("none")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaError, setMfaError] = useState("")
  const [pendingAction, setPendingAction] =
    useState<"retry" | "escalate" | null>(null)
  const [auditFilter, setAuditFilter] = useState<AuditCategory | "all">("all")
  const [retrySuccess, setRetrySuccess] = useState<string | null>(null)

  /* ── Full audit log state ── */
  const [auditSearch, setAuditSearch] = useState("")
  const [auditCatFilter, setAuditCatFilter] = useState<AuditCategory | "all">(
    "all",
  )
  const [auditRoleFilter, setAuditRoleFilter] = useState<UserRole | "all">(
    "all",
  )
  const [auditHubFilter, setAuditHubFilter] = useState("All Hubs")
  const [auditResultFilter, setAuditResultFilter] =
    useState<"all" | "success" | "failure" | "warning">("all")
  const [auditDateFilter, setAuditDateFilter] =
    useState<"today" | "week" | "all">("all")
  const [selectedAuditEntry, setSelectedAuditEntry] =
    useState<FullAuditEntry | null>(null)

  const totalEnrolled = HUBS.reduce((s, h) => s + h.enrolled, 0)
  const totalSubmitted = HUBS.reduce((s, h) => s + h.submitted, 0)
  const totalApproved = HUBS.reduce((s, h) => s + h.pendingApproval, 0)
  const totalMinted = HUBS.reduce((s, h) => s + h.minted, 0)
  const failed = txs.filter((t) => t.status === "failed")
  const failedCount = failed.length
  const confirmed = txs.filter((t) => t.status === "confirmed").length
  const queued = txs.filter((t) => t.status === "queued").length
  const minting = txs.filter((t) => t.status === "minting").length

  function openIntervene(tx: MintTx) {
    setSelectedTx(tx)
    setModal("intervene")
  }

  function initiateAction(action: "retry" | "escalate") {
    setPendingAction(action)
    setMfaCode("")
    setMfaError("")
    setModal("mfa")
  }

  function handleMfaConfirm() {
    if (mfaCode !== "123456") {
      setMfaError("Invalid MFA code. Demo code: 123456")
      return
    }
    if (!selectedTx) return
    if (pendingAction === "retry") {
      setTxs((ts) =>
        ts.map((t) =>
          t.id === selectedTx.id
            ? {
                ...t,
                status: "queued",
                retryCount: t.retryCount + 1,
                failReason: undefined,
                lastUpdated: "Just now",
              }
            : t,
        ),
      )
      setRetrySuccess(selectedTx.credId)
      setTimeout(() => setRetrySuccess(null), 4000)
    } else {
      setTxs((ts) =>
        ts.map((t) =>
          t.id === selectedTx.id
            ? {
                ...t,
                failReason:
                  "⚑ Escalated for manual intervention — awaiting ops team.",
                lastUpdated: "Just now",
              }
            : t,
        ),
      )
    }
    setModal("none")
    setSelectedTx(null)
    setPendingAction(null)
    setMfaCode("")
  }

  const TABS: { key: Tab; label: string; alert?: number }[] = [
    { key: "overview", label: "Overview" },
    {
      key: "hubs",
      label: "Hub Progress",
      alert: HUBS.filter((h) => h.status !== "on-track").length,
    },
    { key: "minting", label: "Minting Queue", alert: failedCount },
    {
      key: "devices",
      label: "Device Health",
      alert: DEVICES.filter((d) => d.deviceStatus !== "online").length,
    },
    { key: "audit", label: "Audit Log" },
  ]

  const visibleAudit = AUDIT_LOG.filter(
    (e) => auditFilter === "all" || e.category === auditFilter,
  )

  const ROLE_LABELS: Record<UserRole, string> = {
    "trade-tester": "Trade Tester",
    "center-superintendent": "Ctr. Superintendent",
    "super-admin": "Super Admin",
    system: "System",
  }
  const CAT_LABELS: Record<AuditCategory | "all", string> = {
    all: "All Events",
    auth: "Auth & Session",
    assessment: "Assessment",
    approval: "Approval",
    mint: "Minting",
    credential: "Credential",
    admin: "Admin",
    device: "Device",
  }

  const filteredFullAudit = useMemo(() => {
    const today = "2026-08-27"
    const weekStart = "2026-08-21"
    return FULL_AUDIT_LOG.filter((e) => {
      const q = auditSearch.trim().toLowerCase()
      if (q) {
        const hay = [
          e.user,
          e.eventType,
          e.detail,
          e.targetId ?? "",
          e.ip ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (auditCatFilter !== "all" && e.category !== auditCatFilter)
        return false
      if (auditRoleFilter !== "all" && e.userRole !== auditRoleFilter)
        return false
      if (auditHubFilter !== "All Hubs" && e.hub !== auditHubFilter)
        return false
      if (auditResultFilter !== "all" && e.result !== auditResultFilter)
        return false
      if (auditDateFilter === "today" && !e.timestamp.startsWith(today))
        return false
      if (auditDateFilter === "week" && e.timestamp.slice(0, 10) < weekStart)
        return false
      return true
    })
  }, [
    auditSearch,
    auditCatFilter,
    auditRoleFilter,
    auditHubFilter,
    auditResultFilter,
    auditDateFilter,
  ])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          className="display"
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#24302E",
            margin: "0 0 2px",
            letterSpacing: -0.2,
          }}
        >
          System Monitoring
        </h1>
        <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
          Super Administrator · National Skills Passport — Issuer Portal
        </p>
      </div>

      {/* Retry success banner */}
      {retrySuccess && (
        <div
          style={{
            background: "#EAF3DE",
            border: "1px solid #4C7A6E",
            borderRadius: 6,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#173404",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="7" fill="#4C7A6E" />
            <polyline
              points="3.5,7 5.5,9.5 10.5,4"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {retrySuccess} has been re-queued for minting.
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          borderBottom: "1px solid #D6D3C6",
          paddingBottom: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${
                tab === t.key ? "#4C7A6E" : "transparent"
              }`,
              color: tab === t.key ? "#4C7A6E" : "#5C5A50",
              fontSize: 13,
              fontWeight: tab === t.key ? 700 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: -1,
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
            {t.alert ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "#A6453D",
                  color: "#fff",
                  borderRadius: 999,
                  minWidth: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                }}
              >
                {t.alert}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === "overview" && (
        <div>
          {/* KPI row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              {
                label: "Total Enrolled",
                value: `${totalEnrolled}/300`,
                sub: `${Math.round((totalEnrolled / 300) * 100)}% of cycle target`,
                accent: true,
              },
              {
                label: "Assessments Submitted",
                value: totalSubmitted,
                sub: "Across all hubs",
              },
              {
                label: "Pending Approval",
                value: totalApproved,
                sub: "Awaiting review",
              },
              {
                label: "Credentials Minted",
                value: totalMinted,
                sub: "Confirmed on-chain",
              },
              { label: "Revoked", value: 3, sub: "This cycle" },
              {
                label: "Minting Queue",
                value: queued + minting,
                sub: `${minting} processing`,
              },
              {
                label: "Mint Failures",
                value: failedCount,
                sub: "Require intervention",
                warn: true,
              },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: "#fff",
                  border: `1px solid ${
                    k.warn && k.value as number > 0 ? "#E8B4B4" : "#D6D3C6"
                  }`,
                  borderRadius: 8,
                  padding: "14px 16px",
                  borderTop: k.accent
                    ? "3px solid #4C7A6E"
                    : k.warn && k.value as number > 0
                      ? "3px solid #A6453D"
                      : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#8C897C",
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {k.label}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color:
                      k.warn && k.value as number > 0
                        ? "#A6453D"
                        : k.accent
                          ? "#4C7A6E"
                          : "#24302E",
                    letterSpacing: -0.3,
                    lineHeight: 1,
                  }}
                >
                  {k.value}
                </div>
                <div style={{ fontSize: 11, color: "#8C897C", marginTop: 5 }}>
                  {k.sub}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            {/* System status */}
            <SectionCard title="System Services">
              <div style={{ padding: "4px 0" }}>
                {[
                  {
                    label: "Blockchain Node",
                    status: "online",
                    val: "99.98% uptime",
                  },
                  {
                    label: "NADRA Verification API",
                    status: "online",
                    val: "Avg 142 ms",
                  },
                  {
                    label: "S3 Media Storage",
                    status: "online",
                    val: "1.2 TB / 5 TB",
                  },
                  {
                    label: "Notification Service",
                    status: "degraded",
                    val: "Minor delays (~8s)",
                  },
                  {
                    label: "Sync Gateway",
                    status: "online",
                    val: "All hubs reachable",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 24px",
                      borderBottom: "1px solid #F1EFE8",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background:
                            s.status === "online" ? "#4C7A6E" : "#B08D46",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#24302E" }}>
                        {s.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "#8C897C",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {s.val}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Hub status quick summary */}
            <SectionCard
              title="Hub Status Summary"
              action={
                <button
                  onClick={() => setTab("hubs")}
                  style={{
                    fontSize: 12,
                    color: "#4C7A6E",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  View detail →
                </button>
              }
            >
              <div style={{ padding: "4px 0" }}>
                {HUBS.map((hub) => {
                  const pct = Math.round((hub.enrolled / hub.target) * 100)
                  return (
                    <div
                      key={hub.id}
                      style={{
                        padding: "11px 24px",
                        borderBottom: "1px solid #F1EFE8",
                        display: "grid",
                        gridTemplateColumns: "130px 1fr 70px 80px",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontWeight: 600,
                          color: "#24302E",
                        }}
                      >
                        {hub.name}
                      </span>
                      <div
                        style={{
                          height: 5,
                          background: "#F1EFE8",
                          borderRadius: 3,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background:
                              hub.status === "critical"
                                ? "#A6453D"
                                : hub.status === "behind"
                                  ? "#B08D46"
                                  : "#4C7A6E",
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "#5C5A50",
                          fontFamily: "IBM Plex Mono, monospace",
                          textAlign: "right",
                        }}
                      >
                        {hub.enrolled}/{hub.target}
                      </span>
                      {renderHubPill(hub.status)}
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </div>

          {/* Recent activity feed */}
          <SectionCard
            title="Recent Activity"
            action={
              <button
                onClick={() => setTab("audit")}
                style={{
                  fontSize: 12,
                  color: "#4C7A6E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                Full audit log →
              </button>
            }
          >
            <div style={{ padding: "4px 0" }}>
              {AUDIT_LOG.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 24px",
                    borderBottom: "1px solid #F1EFE8",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        e.result === "success"
                          ? "#4C7A6E"
                          : e.result === "failure"
                            ? "#A6453D"
                            : "#B08D46",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: "#24302E" }}>
                      {e.action}
                    </span>
                    {e.detail && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#8C897C",
                          marginLeft: 8,
                        }}
                      >
                        — {e.detail}
                      </span>
                    )}
                  </div>
                  <span
                    style={{ fontSize: 11.5, color: "#8C897C", flexShrink: 0 }}
                  >
                    {e.user}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#8C897C",
                      fontFamily: "IBM Plex Mono, monospace",
                      flexShrink: 0,
                      width: 130,
                      textAlign: "right",
                    }}
                  >
                    {e.timestamp.split(" ")[1]}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ══ HUB PROGRESS ══ */}
      {tab === "hubs" && (
        <SectionCard title="Hub Enrollment & Assessment Progress">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F1F0EA" }}>
                {[
                  "Hub / ID",
                  "Enrolled",
                  "Submitted",
                  "Pending Approval",
                  "Minted",
                  "Enrollment Progress",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#5C5A50",
                      borderBottom: "1px solid #D6D3C6",
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HUBS.map((hub) => {
                const pct = Math.round((hub.enrolled / hub.target) * 100)
                const isBehind = hub.status !== "on-track"
                return (
                  <tr
                    key={hub.id}
                    style={{
                      borderBottom: "1px solid #F1EFE8",
                      background: isBehind
                        ? hub.status === "critical"
                          ? "#FFF8F8"
                          : "#FFFBF5"
                        : "#fff",
                    }}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#24302E",
                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        {hub.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#8C897C", marginTop: 1 }}
                      >
                        {hub.id}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#24302E",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {hub.enrolled}
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 400,
                          color: "#8C897C",
                        }}
                      >
                        /60
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 13,
                        color: "#24302E",
                      }}
                    >
                      {hub.submitted}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 13,
                        color: hub.pendingApproval > 0 ? "#8C6F35" : "#8C897C",
                        fontWeight: hub.pendingApproval > 0 ? 600 : 400,
                      }}
                    >
                      {hub.pendingApproval}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        fontSize: 13,
                        color: "#24302E",
                      }}
                    >
                      {hub.minted}
                    </td>
                    <td style={{ padding: "14px 20px", minWidth: 180 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            background: "#F1EFE8",
                            borderRadius: 3,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background:
                                hub.status === "critical"
                                  ? "#A6453D"
                                  : hub.status === "behind"
                                    ? "#B08D46"
                                    : "#4C7A6E",
                              borderRadius: 3,
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#5C5A50",
                            width: 34,
                            textAlign: "right",
                            fontFamily: "IBM Plex Mono, monospace",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                      {hub.status !== "on-track" && (
                        <div
                          style={{
                            fontSize: 11,
                            color: hubStatusColor(hub.status),
                            marginTop: 4,
                            fontWeight: 500,
                          }}
                        >
                          {60 - hub.enrolled} more candidates needed
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {renderHubPill(hub.status)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr
                style={{
                  background: "#F1F0EA",
                  borderTop: "2px solid #D6D3C6",
                }}
              >
                <td
                  style={{
                    padding: "12px 20px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#24302E",
                  }}
                >
                  All Hubs
                </td>
                <td
                  style={{
                    padding: "12px 20px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#4C7A6E",
                    fontFamily: "IBM Plex Mono, monospace",
                  }}
                >
                  {HUBS.reduce((s, h) => s + h.enrolled, 0)}
                  <span style={{ fontWeight: 400, color: "#8C897C" }}>
                    /300
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 20px",
                    fontSize: 13,
                    color: "#24302E",
                  }}
                >
                  {HUBS.reduce((s, h) => s + h.submitted, 0)}
                </td>
                <td
                  style={{
                    padding: "12px 20px",
                    fontSize: 13,
                    color: "#8C6F35",
                    fontWeight: 600,
                  }}
                >
                  {HUBS.reduce((s, h) => s + h.pendingApproval, 0)}
                </td>
                <td
                  style={{
                    padding: "12px 20px",
                    fontSize: 13,
                    color: "#24302E",
                  }}
                >
                  {HUBS.reduce((s, h) => s + h.minted, 0)}
                </td>
                <td style={{ padding: "12px 20px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "#F1EFE8",
                        borderRadius: 3,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.round((HUBS.reduce((s, h) => s + h.enrolled, 0) / 300) * 100)}%`,
                          background: "#B08D46",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#5C5A50",
                        width: 34,
                        textAlign: "right",
                        fontFamily: "IBM Plex Mono, monospace",
                      }}
                    >
                      {Math.round(
                        (HUBS.reduce((s, h) => s + h.enrolled, 0) / 300) * 100,
                      )}
                      %
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px 20px" }} />
              </tr>
            </tfoot>
          </table>
        </SectionCard>
      )}

      {/* ══ MINTING QUEUE ══ */}
      {tab === "minting" && (
        <div>
          {/* Mini KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              { label: "Queued", value: queued, color: "#8C897C" },
              { label: "Processing", value: minting, color: "#1A4DB8" },
              { label: "Confirmed", value: confirmed, color: "#4C7A6E" },
              {
                label: "Failed",
                value: failedCount,
                color: failedCount > 0 ? "#A6453D" : "#8C897C",
                warn: failedCount > 0,
              },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: "#fff",
                  border: `1px solid ${k.warn ? "#E8B4B4" : "#D6D3C6"}`,
                  borderRadius: 8,
                  padding: "16px 20px",
                  borderTop: k.warn ? "3px solid #A6453D" : undefined,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#8C897C",
                    letterSpacing: 0.7,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {k.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: k.color,
                    lineHeight: 1,
                    letterSpacing: -0.5,
                  }}
                >
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* Failed transactions — highlighted */}
          {failed.length > 0 && (
            <div
              style={{
                background: "#FFF8F8",
                border: "1px solid #E8B4B4",
                borderRadius: 8,
                marginBottom: 24,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 24px",
                  borderBottom: "1px solid #E8B4B4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#FCEBEB",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#A6453D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#501313" }}
                  >
                    {failed.length} Failed Transaction
                    {failed.length !== 1 ? "s" : ""} — Intervention Required
                  </span>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FFF0F0" }}>
                    {[
                      "Credential ID",
                      "Assessment ID",
                      "Candidate",
                      "Hub",
                      "Failure Reason",
                      "Retries",
                      "Last Updated",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "9px 20px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#8C897C",
                          borderBottom: "1px solid #E8B4B4",
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {failed.map((tx) => (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: "1px solid #FCE0E0" }}
                    >
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#24302E",
                          fontWeight: 600,
                        }}
                      >
                        {tx.credId}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 11,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#5C5A50",
                        }}
                      >
                        {tx.assessId}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 13,
                          color: "#24302E",
                        }}
                      >
                        {tx.candidate}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#5C5A50",
                        }}
                      >
                        {tx.hub}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12,
                          color: "#8C3B34",
                          maxWidth: 220,
                        }}
                      >
                        {tx.failReason}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: tx.retryCount >= 3 ? "#A6453D" : "#5C5A50",
                          fontWeight: tx.retryCount >= 3 ? 700 : 400,
                        }}
                      >
                        {tx.retryCount}
                      </td>
                      <td
                        style={{
                          padding: "13px 20px",
                          fontSize: 11,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#8C897C",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.lastUpdated}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <button
                          onClick={() => openIntervene(tx)}
                          style={{
                            height: 30,
                            padding: "0 14px",
                            background: "#4C7A6E",
                            color: "#fff",
                            border: "none",
                            borderRadius: 5,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Retry / Intervene
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Full queue */}
          <SectionCard title="All Transactions">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F1F0EA" }}>
                  {[
                    "Credential ID",
                    "Assessment ID",
                    "Candidate",
                    "Hub",
                    "Status",
                    "Retries",
                    "Tx Hash",
                    "Last Updated",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 20px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#5C5A50",
                        borderBottom: "1px solid #D6D3C6",
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs
                  .filter((t) => t.status !== "failed")
                  .map((tx, i) => (
                    <tr
                      key={tx.id}
                      style={{ borderBottom: "1px solid #F1EFE8" }}
                    >
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontWeight: 600,
                          color: "#24302E",
                        }}
                      >
                        {tx.credId}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 11,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#5C5A50",
                        }}
                      >
                        {tx.assessId}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 13,
                          color: "#24302E",
                        }}
                      >
                        {tx.candidate}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 11.5,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#5C5A50",
                        }}
                      >
                        {tx.hub}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        {renderMintPill(tx.status)}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#8C897C",
                        }}
                      >
                        {tx.retryCount}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 11,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#8C897C",
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tx.txHash ? tx.txHash.slice(0, 20) + "…" : "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 11,
                          fontFamily: "IBM Plex Mono, monospace",
                          color: "#8C897C",
                        }}
                      >
                        {tx.lastUpdated}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      )}

      {/* ══ DEVICE HEALTH ══ */}
      {tab === "devices" && (
        <div>
          {DEVICES.filter((d) => d.deviceStatus !== "online").length > 0 && (
            <div
              style={{
                background: "#FFFBF5",
                border: "1px solid #B08D46",
                borderRadius: 6,
                padding: "10px 16px",
                marginBottom: 20,
                fontSize: 13,
                color: "#5C3300",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B08D46"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {DEVICES.filter((d) => d.deviceStatus !== "online").length} hub
              {DEVICES.filter((d) => d.deviceStatus !== "online").length !== 1
                ? "s"
                : ""}{" "}
              require attention — check offline and degraded devices below.
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {DEVICES.map((dev) => {
              const deviceStatusColor = (status: string) =>
                status === "online"
                  ? "#4C7A6E"
                  : status === "degraded"
                    ? "#8C6F35"
                    : "#A6453D"
              const isOffline = dev.deviceStatus === "offline"
              const isDegraded = dev.deviceStatus === "degraded"
              return (
                <div
                  key={dev.hubId}
                  style={{
                    background: "#fff",
                    border: `1px solid ${
                      isOffline ? "#E8B4B4" : isDegraded ? "#B08D46" : "#D6D3C6"
                    }`,
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      padding: "14px 20px",
                      borderBottom: `1px solid ${
                        isOffline
                          ? "#E8B4B4"
                          : isDegraded
                            ? "#B08D46"
                            : "#D6D3C6"
                      }`,
                      background: isOffline
                        ? "#FFF8F8"
                        : isDegraded
                          ? "#FFFBF5"
                          : "#fff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#24302E",
                          fontFamily: "IBM Plex Mono, monospace",
                        }}
                      >
                        {dev.hubName}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#8C897C", marginTop: 1 }}
                      >
                        {dev.hubId}
                      </div>
                    </div>
                    <span
                      style={{
                        ...PILL,
                        color: deviceStatusColor(dev.deviceStatus),
                      }}
                    >
                      {dev.deviceStatus === "online"
                        ? "Online"
                        : dev.deviceStatus === "degraded"
                          ? "Degraded"
                          : "Offline"}
                    </span>
                  </div>

                  {/* Card body */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 0,
                    }}
                  >
                    {[
                      {
                        label: "Connectivity",
                        value: dev.connectivity,
                        mono: false,
                      },
                      {
                        label: "Last Connected",
                        value: dev.lastConnected,
                        mono: false,
                      },
                      {
                        label: "Device Health",
                        value:
                          dev.deviceHealth === "good"
                            ? "Good"
                            : dev.deviceHealth === "degraded"
                              ? "Degraded"
                              : "Critical",
                        color:
                          dev.deviceHealth === "good"
                            ? "#4C7A6E"
                            : dev.deviceHealth === "degraded"
                              ? "#8C6F35"
                              : "#A6453D",
                      },
                      {
                        label: "EDR / Security",
                        value:
                          dev.edrStatus === "active"
                            ? "Active"
                            : dev.edrStatus === "warning"
                              ? "Warning"
                              : "Inactive",
                        color:
                          dev.edrStatus === "active"
                            ? "#4C7A6E"
                            : dev.edrStatus === "warning"
                              ? "#8C6F35"
                              : "#A6453D",
                      },
                      { label: "Last Sync", value: dev.lastSync, mono: false },
                      {
                        label: "Offline Records",
                        value:
                          dev.offlineRecords > 0
                            ? `${dev.offlineRecords} waiting`
                            : "None",
                        color: dev.offlineRecords > 0 ? "#8C6F35" : "#4C7A6E",
                      },
                    ].map((row, i) => (
                      <div
                        key={row.label}
                        style={{
                          padding: "11px 20px",
                          borderBottom: i < 4 ? "1px solid #F1EFE8" : "none",
                          borderRight:
                            i % 2 === 0 ? "1px solid #F1EFE8" : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#8C897C",
                            letterSpacing: 0.6,
                            textTransform: "uppercase",
                            marginBottom: 3,
                          }}
                        >
                          {row.label}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: (row as any).color ?? "#24302E",
                            fontWeight: (row as any).color ? 600 : 400,
                            fontFamily: row.mono
                              ? "IBM Plex Mono, monospace"
                              : "inherit",
                          }}
                        >
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ AUDIT LOG ══ */}
      {tab === "audit" && (
        <div>
          {/* Search + filters */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div
              style={{ position: "relative", flex: "1 1 220px", minWidth: 200 }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C897C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={auditSearch}
                onChange={(e) => {
                  setAuditSearch(e.target.value)
                  setSelectedAuditEntry(null)
                }}
                placeholder="Search user, event, credential ID, IP…"
                style={{
                  height: 36,
                  width: "100%",
                  paddingLeft: 30,
                  paddingRight: 12,
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                  fontSize: 12.5,
                  color: "#24302E",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <Select
              value={auditCatFilter}
              onChange={(v) => {
                setAuditCatFilter(v as AuditCategory | "all")
                setSelectedAuditEntry(null)
              }}
              options={(Object.entries(
                CAT_LABELS,
              ) as [AuditCategory | "all", string][]).map(([k, v]) => ({
                value: k,
                label: v,
              }))}
              style={{ height: 36, fontSize: 12.5 }}
            />
            <Select
              value={auditRoleFilter}
              onChange={(v) => {
                setAuditRoleFilter(v as UserRole | "all")
                setSelectedAuditEntry(null)
              }}
              options={[
                { value: "all", label: "All Roles" },
                ...([
                  "trade-tester",
                  "center-superintendent",
                  "super-admin",
                  "system",
                ] as UserRole[]).map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r],
                })),
              ]}
              style={{ height: 36, fontSize: 12.5 }}
            />
            <Select
              value={auditHubFilter}
              onChange={(v) => {
                setAuditHubFilter(v)
                setSelectedAuditEntry(null)
              }}
              options={[
                "All Hubs",
                "Lahore-C01",
                "Karachi-C02",
                "Islamabad-C03",
                "Peshawar-C04",
                "Quetta-C05",
              ].map((h) => ({ value: h, label: h }))}
              style={{ height: 36, fontSize: 12.5 }}
            />
            <Select
              value={auditResultFilter}
              onChange={(v) => {
                setAuditResultFilter(v as any)
                setSelectedAuditEntry(null)
              }}
              options={[
                { value: "all", label: "All Results" },
                { value: "success", label: "Success" },
                { value: "failure", label: "Failure" },
                { value: "warning", label: "Warning" },
              ]}
              style={{ height: 36, fontSize: 12.5 }}
            />
            <Select
              value={auditDateFilter}
              onChange={(v) => {
                setAuditDateFilter(v as any)
                setSelectedAuditEntry(null)
              }}
              options={[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "Last 7 Days" },
              ]}
              style={{ height: 36, fontSize: 12.5 }}
            />
            {(auditSearch ||
              auditCatFilter !== "all" ||
              auditRoleFilter !== "all" ||
              auditHubFilter !== "All Hubs" ||
              auditResultFilter !== "all" ||
              auditDateFilter !== "all") && (
              <button
                onClick={() => {
                  setAuditSearch("")
                  setAuditCatFilter("all")
                  setAuditRoleFilter("all")
                  setAuditHubFilter("All Hubs")
                  setAuditResultFilter("all")
                  setAuditDateFilter("all")
                  setSelectedAuditEntry(null)
                }}
                style={{
                  height: 36,
                  padding: "0 14px",
                  background: "#F1F0EA",
                  color: "#5C5A50",
                  border: "1px solid #D6D3C6",
                  borderRadius: 6,
                  fontSize: 12.5,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Count + read-only notice */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12.5, color: "#5C5A50" }}>
              Showing{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: "#4C7A6E",
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              >
                {filteredFullAudit.length}
              </span>{" "}
              of {FULL_AUDIT_LOG.length} events
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#F1F0EA",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11.5,
                color: "#5C5A50",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8C897C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Read-only — immutable audit record
            </div>
          </div>

          {/* Split layout: table + detail panel */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* Table */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                background: "#fff",
                border: "1px solid #D6D3C6",
                borderRadius: 8,
                overflow: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 700,
                }}
              >
                <thead>
                  <tr style={{ background: "#F1F0EA" }}>
                    {[
                      "Timestamp",
                      "Event",
                      "User / Role",
                      "Hub",
                      "Target",
                      "IP Address",
                      "Result",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "9px 16px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#5C5A50",
                          borderBottom: "1px solid #D6D3C6",
                          letterSpacing: 0.4,
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFullAudit.map((e) => {
                    const isSelected = selectedAuditEntry?.id === e.id
                    return (
                      <tr
                        key={e.id}
                        onClick={() =>
                          setSelectedAuditEntry(isSelected ? null : e)
                        }
                        style={{
                          borderBottom: "1px solid #F1EFE8",
                          background: isSelected
                            ? "#EDF2F8"
                            : e.result === "failure"
                              ? "#FFF8F8"
                              : "#fff",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(ev) => {
                          if (!isSelected)
                            (ev.currentTarget as HTMLTableRowElement).style.background =
                              "#F1F0EA"
                        }}
                        onMouseLeave={(ev) => {
                          if (!isSelected)
                            (ev.currentTarget as HTMLTableRowElement).style.background =
                              e.result === "failure" ? "#FFF8F8" : "#fff"
                        }}
                      >
                        <td
                          style={{
                            padding: "11px 16px",
                            fontSize: 11,
                            fontFamily: "IBM Plex Mono, monospace",
                            color: "#8C897C",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.timestamp}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "#24302E",
                            }}
                          >
                            {e.eventType}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#8C897C",
                              marginTop: 2,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "1px 7px",
                                background: "#E4E2D9",
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#5C5A50",
                                textTransform: "capitalize",
                              }}
                            >
                              {e.category}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ fontSize: 12.5, color: "#24302E" }}>
                            {e.user}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: "#8C897C",
                              marginTop: 1,
                            }}
                          >
                            {ROLE_LABELS[e.userRole]}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "11px 16px",
                            fontSize: 11.5,
                            fontFamily: "IBM Plex Mono, monospace",
                            color: "#8C897C",
                          }}
                        >
                          {e.hub}
                        </td>
                        <td
                          style={{
                            padding: "11px 16px",
                            fontSize: 11,
                            fontFamily: "IBM Plex Mono, monospace",
                            color: "#5C5A50",
                            maxWidth: 130,
                          }}
                        >
                          {e.targetId ? (
                            <span
                              style={{
                                background: "#F1EFE8",
                                borderRadius: 4,
                                padding: "2px 6px",
                                display: "inline-block",
                                maxWidth: 120,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {e.targetId}
                            </span>
                          ) : (
                            <span style={{ color: "#D6D3C6" }}>—</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "11px 16px",
                            fontSize: 11,
                            fontFamily: "IBM Plex Mono, monospace",
                            color: "#8C897C",
                          }}
                        >
                          {e.ip ?? "—"}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <span
                            style={{
                              ...PILL,
                              color: auditColor(e.result),
                              background: auditBg(e.result),
                              fontSize: 10,
                              padding: "2px 8px",
                            }}
                          >
                            {e.result}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredFullAudit.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 48,
                          textAlign: "center",
                          fontSize: 13,
                          color: "#8C897C",
                        }}
                      >
                        No events match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selectedAuditEntry && (
              <div
                style={{
                  width: 360,
                  flexShrink: 0,
                  background: "#fff",
                  border: "1px solid #D6D3C6",
                  borderRadius: 8,
                  overflow: "hidden",
                  position: "sticky",
                  top: 0,
                }}
              >
                {/* Panel header */}
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #D6D3C6",
                    background: "#F1F0EA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#24302E",
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {selectedAuditEntry.eventType}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          ...PILL,
                          fontSize: 10,
                          padding: "2px 8px",
                          textTransform: "capitalize",
                          color: "#5C5A50",
                        }}
                      >
                        {selectedAuditEntry.category}
                      </span>
                      <span
                        style={{
                          ...PILL,
                          fontSize: 10,
                          padding: "2px 8px",
                          color: auditColor(selectedAuditEntry.result),
                          background: auditBg(selectedAuditEntry.result),
                        }}
                      >
                        {selectedAuditEntry.result}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAuditEntry(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#8C897C",
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Panel body */}
                <div
                  style={{
                    padding: "16px 20px",
                    maxHeight: "70vh",
                    overflowY: "auto",
                  }}
                >
                  {/* Core fields */}
                  {[
                    {
                      label: "Timestamp",
                      value: selectedAuditEntry.timestamp,
                      mono: true,
                    },
                    { label: "User", value: selectedAuditEntry.user },
                    {
                      label: "Role",
                      value: ROLE_LABELS[selectedAuditEntry.userRole],
                    },
                    { label: "Hub", value: selectedAuditEntry.hub, mono: true },
                    ...(selectedAuditEntry.targetId
                      ? [
                          {
                            label: "Target ID",
                            value: selectedAuditEntry.targetId,
                            mono: true,
                          },
                        ]
                      : []),
                    ...(selectedAuditEntry.ip
                      ? [
                          {
                            label: "IP Address",
                            value: selectedAuditEntry.ip,
                            mono: true,
                          },
                        ]
                      : []),
                    ...(selectedAuditEntry.device
                      ? [{ label: "Device", value: selectedAuditEntry.device }]
                      : []),
                  ].map((row) => (
                    <div key={row.label} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#8C897C",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          marginBottom: 2,
                        }}
                      >
                        {row.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "#24302E",
                          fontFamily: (row as any).mono
                            ? "IBM Plex Mono, monospace"
                            : "inherit",
                          wordBreak: "break-all",
                        }}
                      >
                        {row.value}
                      </div>
                    </div>
                  ))}

                  {/* Detail */}
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#8C897C",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 4,
                      }}
                    >
                      Summary
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "#24302E",
                        lineHeight: 1.6,
                        background: "#F1F0EA",
                        borderRadius: 6,
                        padding: "10px 12px",
                        border: "1px solid #E5E3DC",
                      }}
                    >
                      {selectedAuditEntry.detail}
                    </div>
                  </div>

                  {/* Extra metadata */}
                  {selectedAuditEntry.metadata &&
                    Object.keys(selectedAuditEntry.metadata).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#8C897C",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 8,
                          }}
                        >
                          Additional Information
                        </div>
                        <div
                          style={{
                            border: "1px solid #E5E3DC",
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          {Object.entries(selectedAuditEntry.metadata).map(
                            ([k, v], i, arr) => (
                              <div
                                key={k}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "120px 1fr",
                                  borderBottom:
                                    i < arr.length - 1
                                      ? "1px solid #F1EFE8"
                                      : "none",
                                }}
                              >
                                <div
                                  style={{
                                    padding: "8px 12px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#8C897C",
                                    background: "#F1F0EA",
                                    borderRight: "1px solid #E5E3DC",
                                  }}
                                >
                                  {k}
                                </div>
                                <div
                                  style={{
                                    padding: "8px 12px",
                                    fontSize: 11.5,
                                    color: "#24302E",
                                    fontFamily: /hash|block|tx|id|ip/i.test(k)
                                      ? "IBM Plex Mono, monospace"
                                      : "inherit",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {v}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Immutable notice */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      background: "#F1F0EA",
                      border: "1px solid #D6D3C6",
                      borderRadius: 6,
                      padding: "10px 12px",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8C897C"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#8C897C",
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      This record is immutable. Audit entries cannot be edited
                      or deleted by any user, including Super Admins.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ INTERVENE MODAL ══ */}
      {modal === "intervene" && selectedTx && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "#FCEBEB",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A6453D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Failed Transaction — Intervention
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                Review the failure details before taking action. All
                interventions require step-up MFA.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#F1F0EA",
              border: "1px solid #D6D3C6",
              borderRadius: 6,
              padding: "16px 20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 24px",
                fontSize: 13,
              }}
            >
              {[
                ["Credential ID", selectedTx.credId, true],
                ["Assessment ID", selectedTx.assessId, true],
                ["Candidate", selectedTx.candidate, false],
                ["Hub", selectedTx.hub, true],
                ["Current Status", "Failed", false],
                ["Retry Count", String(selectedTx.retryCount), true],
                ["Last Attempted", selectedTx.lastUpdated, true],
                ["Tx Hash", selectedTx.txHash ?? "Not available", true],
              ].map(([k, v, mono]) => (
                <div key={k as string}>
                  <div
                    style={{
                      color: "#8C897C",
                      marginBottom: 2,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      color: "#24302E",
                      fontFamily: mono ? "IBM Plex Mono, monospace" : "inherit",
                      fontSize: mono ? 12 : 13,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #D6D3C6",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#8C897C",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Failure Reason
              </div>
              <div style={{ fontSize: 13, color: "#8C3B34", lineHeight: 1.5 }}>
                {selectedTx.failReason}
              </div>
            </div>
          </div>

          {selectedTx.retryCount >= 3 && (
            <div
              style={{
                background: "#FCEBEB",
                border: "1px solid #E8B4B4",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                color: "#501313",
              }}
            >
              This transaction has failed{" "}
              <strong>{selectedTx.retryCount} times</strong>. Consider
              escalating for manual intervention instead of retrying.
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => initiateAction("retry")}
              style={{
                flex: 1,
                height: 40,
                background: "#4C7A6E",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry Minting
            </button>
            <button
              onClick={() => initiateAction("escalate")}
              style={{
                flex: 1,
                height: 40,
                background: "#fff",
                color: "#8C3B34",
                border: "1px solid #A6453D",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Escalate for Manual Intervention
            </button>
            <button
              onClick={() => {
                setModal("none")
                setSelectedTx(null)
              }}
              style={{
                height: 40,
                padding: "0 18px",
                background: "#fff",
                color: "#24302E",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ══ STEP-UP MFA MODAL ══ */}
      {modal === "mfa" && selectedTx && (
        <ModalOverlay>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: "#FCE8D6",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B08D46"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#24302E",
                  margin: "0 0 4px",
                }}
              >
                Step-Up MFA Required
              </h2>
              <p style={{ fontSize: 13, color: "#5C5A50", margin: 0 }}>
                This action requires additional verification before it can
                proceed.
              </p>
            </div>
          </div>

          <div
            style={{
              background: "#FFF8F8",
              border: "1px solid #E8B4B4",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#8C897C",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              Sensitive Action
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#501313" }}>
              {pendingAction === "retry"
                ? `Retry minting for ${selectedTx.credId}`
                : `Escalate ${selectedTx.credId} for manual intervention`}
            </div>
            <div style={{ fontSize: 12, color: "#8C3B34", marginTop: 4 }}>
              {pendingAction === "retry"
                ? "This will re-queue the credential for minting. This action is irreversible once the transaction is broadcast."
                : "This will flag the credential for the operations team. The team will be notified immediately."}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#24302E",
                marginBottom: 8,
              }}
            >
              Authenticator Code <span style={{ color: "#A6453D" }}>*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value.replace(/\D/g, ""))
                setMfaError("")
              }}
              placeholder="6-digit code"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${mfaError ? "#A6453D" : "#D6D3C6"}`,
                borderRadius: 6,
                fontSize: 18,
                fontFamily: "IBM Plex Mono, monospace",
                letterSpacing: 4,
                textAlign: "center",
                color: "#24302E",
                background: "#fff",
                boxSizing: "border-box",
              }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleMfaConfirm()}
            />
            {mfaError && (
              <p style={{ fontSize: 12, color: "#A6453D", margin: "6px 0 0" }}>
                {mfaError}
              </p>
            )}
            <p style={{ fontSize: 11.5, color: "#8C897C", margin: "6px 0 0" }}>
              Demo: enter{" "}
              <span
                style={{
                  fontFamily: "IBM Plex Mono, monospace",
                  fontWeight: 600,
                }}
              >
                123456
              </span>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleMfaConfirm}
              disabled={mfaCode.length !== 6}
              style={{
                flex: 1,
                height: 42,
                background: mfaCode.length === 6 ? "#4C7A6E" : "#D6D3C6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: mfaCode.length === 6 ? "pointer" : "not-allowed",
              }}
            >
              Confirm Action
            </button>
            <button
              onClick={() => {
                setModal("intervene")
                setMfaCode("")
                setMfaError("")
              }}
              style={{
                height: 42,
                padding: "0 20px",
                background: "#fff",
                color: "#24302E",
                border: "1px solid #D6D3C6",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
