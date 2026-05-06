export function sanitizeRelativePath(
  value: string | null | undefined,
  fallback = "/"
) {
  const path = String(value || "").trim()

  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return fallback
  }

  try {
    const base = "https://local.invalid"
    const parsed = new URL(path, base)

    if (parsed.origin !== base) {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback
  } catch {
    return fallback
  }
}
