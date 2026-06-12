import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  activateDriver,
} from "@/services/drivers"
import type { Driver } from "@/types/api"

const BASE = `${API_BASE_URL}/drivers`

const mockDriver: Driver = {
  id: 1,
  user: 10,
  license_number: "LIC-001",
  phone: "+51999000111",
  email: "conductor@logistica.com",
  hire_date: "2025-01-15",
  is_available: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getDrivers", () => {
  it("returns parsed results from a PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockDriver],
        })
      )
    )
    const result = await getDrivers()
    expect(result).toEqual([mockDriver])
  })

  it("returns array directly when response is an array", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockDriver])))
    const result = await getDrivers()
    expect(result).toEqual([mockDriver])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getDrivers()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getDrivers()).rejects.toThrow()
  })
})

describe("getDriver", () => {
  it("fetches a single driver by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockDriver)))
    const result = await getDriver(1)
    expect(result).toEqual(mockDriver)
  })

  it("throws on 404", async () => {
    server.use(
      http.get(`${BASE}/999/`, () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 })
      )
    )
    await expect(getDriver(999)).rejects.toThrow()
  })
})

describe("createDriver", () => {
  it("POSTs the payload and returns the created driver", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockDriver, id: 2 }, { status: 201 })
      })
    )
    const payload = { license_number: "LIC-002", user: 11 }
    const result = await createDriver(payload)
    expect(capturedBody).toMatchObject(payload)
    expect(result.id).toBe(2)
  })
})

describe("updateDriver", () => {
  it("PUTs the payload and returns the updated driver", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockDriver, phone: "+51999000222" })
      })
    )
    const result = await updateDriver(1, { phone: "+51999000222" })
    expect(capturedBody).toMatchObject({ phone: "+51999000222" })
    expect(result.phone).toBe("+51999000222")
  })
})

describe("deleteDriver", () => {
  it("DELETEs the driver and returns the response", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteDriver(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})

describe("activateDriver", () => {
  it("PATCHes with is_active=true", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockDriver, is_active: true })
      })
    )
    const result = await activateDriver(1)
    expect(capturedBody).toEqual({ is_active: true })
    expect(result.is_active).toBe(true)
  })
})
