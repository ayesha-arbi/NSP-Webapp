// Device Credential Storage & Heartbeat (Capstone B3)
// Hub laptops store a 64-character hex device token assigned during hardware provisioning.
// This module manages local storage of that credential and periodic heartbeat reporting.

const DEVICE_CREDENTIAL_KEY = "nsp_device_credential"

export function getDeviceCredential(): string | null {
  try {
    return localStorage.getItem(DEVICE_CREDENTIAL_KEY)
  } catch {
    return null
  }
}

export function setDeviceCredential(credential: string): void {
  try {
    localStorage.setItem(DEVICE_CREDENTIAL_KEY, credential)
  } catch {}
}

export function clearDeviceCredential(): void {
  try {
    localStorage.removeItem(DEVICE_CREDENTIAL_KEY)
  } catch {}
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start periodic device heartbeat reporting (every 60 seconds).
 * Only runs if a device credential is stored locally.
 */
export function startDeviceHeartbeat(
  sendHeartbeat: (credential: string, fingerprint: string) => Promise<unknown>,
  getFingerprint: () => Promise<string>,
): () => void {
  stopDeviceHeartbeat()

  const tick = async () => {
    const credential = getDeviceCredential()
    if (!credential) return
    try {
      const fp = await getFingerprint()
      await sendHeartbeat(credential, fp)
    } catch {
      // Heartbeat failures are non-fatal; next tick will retry.
    }
  }

  // Fire immediately then every 60s
  tick()
  heartbeatInterval = setInterval(tick, 60_000)

  return stopDeviceHeartbeat
}

export function stopDeviceHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}
