import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import api from "@/lib/axios"

const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(REFRESH_KEY, "valid-refresh")
})

afterEach(() => {
  server.resetHandlers()
})

describe("request interceptor", () => {
  it("adds Authorization header when access token exists", async () => {
    localStorage.setItem(ACCESS_KEY, "my-jwt-token")

    let capturedAuth: string | null = null
    server.use(
      http.get(`${API_BASE_URL}/test-auth/`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get("/test-auth/")
    expect(capturedAuth).toBe("Bearer my-jwt-token")
  })

  it("does not add Authorization header when no access token", async () => {
    localStorage.removeItem(ACCESS_KEY)

    let capturedAuth: string | null = "unset"
    server.use(
      http.get(`${API_BASE_URL}/test-noauth/`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization")
        return HttpResponse.json({ ok: true })
      })
    )

    await api.get("/test-noauth/")
    expect(capturedAuth).toBeNull()
  })
})

describe("response interceptor – 401 handling", () => {
  it("retries successfully after refreshing the token", async () => {
    localStorage.setItem(ACCESS_KEY, "expired-token")
    localStorage.setItem(REFRESH_KEY, "valid-refresh")

    let callCount = 0
    server.use(
      http.get(`${API_BASE_URL}/test-retry/`, ({ request }) => {
        callCount++
        const auth = request.headers.get("Authorization")
        if (callCount === 1) {
          expect(auth).toBe("Bearer expired-token")
          return HttpResponse.json({}, { status: 401 })
        }
        expect(auth).toBe("Bearer new-access-token")
        return HttpResponse.json({ success: true })
      }),
      http.post(`${API_BASE_URL}/auth/refresh/`, async ({ request }) => {
        const body = (await request.json()) as { refresh: string }
        expect(body.refresh).toBe("valid-refresh")
        return HttpResponse.json({ access: "new-access-token" })
      })
    )

    const res = await api.get("/test-retry/")
    expect(res.data).toEqual({ success: true })
    expect(callCount).toBe(2)
    expect(localStorage.getItem(ACCESS_KEY)).toBe("new-access-token")
  })

  it("rejects without redirecting when no refresh token is present", async () => {
    localStorage.removeItem(REFRESH_KEY)
    localStorage.setItem(ACCESS_KEY, "some-token")

    server.use(
      http.get(`${API_BASE_URL}/test-norefresh/`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    )

    await expect(api.get("/test-norefresh/")).rejects.toThrow()

    expect(localStorage.getItem(ACCESS_KEY)).toBe("some-token")
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it("clears tokens and rejects when refresh also fails", async () => {
    localStorage.setItem(ACCESS_KEY, "expired-token")
    localStorage.setItem(REFRESH_KEY, "invalid-refresh")

    server.use(
      http.get(`${API_BASE_URL}/test-fail-refresh/`, () =>
        HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${API_BASE_URL}/auth/refresh/`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    )

    await expect(api.get("/test-fail-refresh/")).rejects.toThrow()

    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  it("does not enter an infinite loop on repeated 401 (_retry flag)", async () => {
    localStorage.setItem(ACCESS_KEY, "token")
    localStorage.setItem(REFRESH_KEY, "refresh")

    let attempts = 0
    server.use(
      http.get(`${API_BASE_URL}/test-loop/`, () => {
        attempts++
        return HttpResponse.json({}, { status: 401 })
      }),
      http.post(`${API_BASE_URL}/auth/refresh/`, () =>
        HttpResponse.json({ access: "new-token" })
      )
    )

    await expect(api.get("/test-loop/")).rejects.toThrow()
    expect(attempts).toBe(2)
  })
})
