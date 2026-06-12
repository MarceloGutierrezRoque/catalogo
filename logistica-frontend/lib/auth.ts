export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

export function setTokens(
  access?: string,
  refresh?: string
): void {
  if (typeof window === "undefined") return
  if (access !== undefined) {
    localStorage.setItem("access_token", access)
  }
  if (refresh !== undefined) {
    localStorage.setItem("refresh_token", refresh)
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  const token = localStorage.getItem("access_token")
  return Boolean(token)
}
