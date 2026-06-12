import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getTransports,
  getTransport,
  createTransport,
  updateTransport,
  deleteTransport,
  activateTransport,
} from "@/services/transports"
import type { Transport } from "@/types/api"

const BASE = `${API_BASE_URL}/transports`

const mockTransport: Transport = {
  id: 1,
  plate: "ABC-123",
  vehicle_type: "truck",
  brand: "Toyota",
  model: "Hilux",
  year: 2020,
  capacity_kg: "1500.00",
  capacity_volume: "10.00",
  is_available: true,
  is_active: true,
  created_at: "",
  updated_at: "",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getTransports", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [mockTransport] })
      )
    )
    const result = await getTransports()
    expect(result).toEqual([mockTransport])
  })

  it("returns array directly", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockTransport])))
    const result = await getTransports()
    expect(result).toEqual([mockTransport])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getTransports()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getTransports()).rejects.toThrow()
  })
})

describe("getTransport", () => {
  it("fetches a single transport by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockTransport)))
    const result = await getTransport(1)
    expect(result).toEqual(mockTransport)
  })
})

describe("createTransport", () => {
  it("POSTs and returns the created transport", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockTransport, id: 2 }, { status: 201 })
      })
    )
    const result = await createTransport({ plate: "XYZ-999" })
    expect(capturedBody).toMatchObject({ plate: "XYZ-999" })
    expect(result.id).toBe(2)
  })
})

describe("updateTransport", () => {
  it("PUTs and returns the updated transport", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockTransport, plate: "UPD-001" })
      })
    )
    const result = await updateTransport(1, { plate: "UPD-001" })
    expect(capturedBody).toMatchObject({ plate: "UPD-001" })
    expect(result.plate).toBe("UPD-001")
  })
})

describe("deleteTransport", () => {
  it("DELETEs the transport", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteTransport(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})

describe("activateTransport", () => {
  it("PATCHes with is_active=true", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockTransport, is_active: true })
      })
    )
    const result = await activateTransport(1)
    expect(capturedBody).toEqual({ is_active: true })
    expect(result.is_active).toBe(true)
  })
})
