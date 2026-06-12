import { describe, expect, it, beforeEach, vi } from "vitest"
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isAuthenticated,
} from "@/lib/auth"

const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

beforeEach(() => {
  localStorage.clear()
})

describe("getAccessToken", () => {
  it("returns the access token from localStorage", () => {
    localStorage.setItem(ACCESS_KEY, "my-access-token")
    expect(getAccessToken()).toBe("my-access-token")
  })

  it("returns null when no access token", () => {
    expect(getAccessToken()).toBeNull()
  })
})

describe("getRefreshToken", () => {
  it("returns the refresh token from localStorage", () => {
    localStorage.setItem(REFRESH_KEY, "my-refresh-token")
    expect(getRefreshToken()).toBe("my-refresh-token")
  })

  it("returns null when no refresh token", () => {
    expect(getRefreshToken()).toBeNull()
  })
})

describe("setTokens", () => {
  it("sets both access and refresh tokens", () => {
    setTokens("access-123", "refresh-456")
    expect(localStorage.getItem(ACCESS_KEY)).toBe("access-123")
    expect(localStorage.getItem(REFRESH_KEY)).toBe("refresh-456")
  })

  it("sets only access when refresh is not provided", () => {
    localStorage.setItem(REFRESH_KEY, "existing-refresh")
    setTokens("new-access")
    expect(localStorage.getItem(ACCESS_KEY)).toBe("new-access")
    expect(localStorage.getItem(REFRESH_KEY)).toBe("existing-refresh")
  })

  it("sets only refresh when access is not provided", () => {
    localStorage.setItem(ACCESS_KEY, "existing-access")
    setTokens(undefined, "new-refresh")
    expect(localStorage.getItem(ACCESS_KEY)).toBe("existing-access")
    expect(localStorage.getItem(REFRESH_KEY)).toBe("new-refresh")
  })

  it("does not modify localStorage when neither argument is provided", () => {
    localStorage.setItem(ACCESS_KEY, "a")
    localStorage.setItem(REFRESH_KEY, "r")
    setTokens()
    expect(localStorage.getItem(ACCESS_KEY)).toBe("a")
    expect(localStorage.getItem(REFRESH_KEY)).toBe("r")
  })
})

describe("clearTokens", () => {
  it("removes both tokens from localStorage", () => {
    localStorage.setItem(ACCESS_KEY, "a")
    localStorage.setItem(REFRESH_KEY, "r")
    clearTokens()
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})

describe("isAuthenticated", () => {
  it("returns true when access token exists", () => {
    localStorage.setItem(ACCESS_KEY, "some-token")
    expect(isAuthenticated()).toBe(true)
  })

  it("returns false when access token is null", () => {
    expect(isAuthenticated()).toBe(false)
  })

  it("returns false when access token is empty string", () => {
    localStorage.setItem(ACCESS_KEY, "")
    expect(isAuthenticated()).toBe(false)
  })
})

describe("SSR guards", () => {
  it("getAccessToken returns null on server", () => {
    const origWindow = globalThis.window
    vi.stubGlobal("window", undefined)
    try {
      expect(getAccessToken()).toBeNull()
    } finally {
      vi.stubGlobal("window", origWindow)
    }
  })

  it("getRefreshToken returns null on server", () => {
    const origWindow = globalThis.window
    vi.stubGlobal("window", undefined)
    try {
      expect(getRefreshToken()).toBeNull()
    } finally {
      vi.stubGlobal("window", origWindow)
    }
  })

  it("isAuthenticated returns false on server", () => {
    const origWindow = globalThis.window
    vi.stubGlobal("window", undefined)
    try {
      expect(isAuthenticated()).toBe(false)
    } finally {
      vi.stubGlobal("window", origWindow)
    }
  })

  it("setTokens does nothing on server", () => {
    const origWindow = globalThis.window
    vi.stubGlobal("window", undefined)
    try {
      setTokens("should-not-be-set")
      expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    } finally {
      vi.stubGlobal("window", origWindow)
    }
  })

  it("clearTokens does nothing on server", () => {
    localStorage.setItem(ACCESS_KEY, "value")
    const origWindow = globalThis.window
    vi.stubGlobal("window", undefined)
    try {
      clearTokens()
    } finally {
      vi.stubGlobal("window", origWindow)
    }
    expect(localStorage.getItem(ACCESS_KEY)).toBe("value")
  })
})
