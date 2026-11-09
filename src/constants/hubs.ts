export const HUB_NAMES = [
  "Lahore-C01",
  "Karachi-C02",
  "Islamabad-C03",
  "Faisalabad-C04",
  "Peshawar-C05",
  "Multan-C06",
  "Rawalpindi-C07",
  "Hyderabad-C08",
] as const

/** Returns a display label for a hub id, or null when there is no hub. */
export function getHubLabel(hub?: number | string | null): string | null {
  if (hub === null || hub === undefined || hub === "") return null
  if (typeof hub === "string" && !/^\d+$/.test(hub.trim())) return hub.trim()
  const id = Number(hub)
  if (!Number.isInteger(id) || id < 1) return null
  return HUB_NAMES[id - 1] ?? `Hub ${id}`
}
