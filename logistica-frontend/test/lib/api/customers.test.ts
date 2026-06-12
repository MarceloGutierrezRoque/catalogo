import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  activateCustomer,
} from "@/services/customers"
import type { Customer } from "@/types/api"

const BASE = `${API_BASE_URL}/customers`

const mockCustomer: Customer = {
  id: 1,
  name: "Juan Pérez",
  customer_type: "company",
  document_type: "ruc",
  document_number: "20123456789",
  email: "juan@example.com",
  phone: "+51999000111",
  address: "Av. Principal 123",
  city: "Lima",
  country: "Perú",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getCustomers", () => {
  it("returns parsed results from a PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockCustomer],
        })
      )
    )
    const result = await getCustomers()
    expect(result).toEqual([mockCustomer])
  })

  it("returns array directly when response is an array", async () => {
    server.use(
      http.get(`${BASE}/`, () => HttpResponse.json([mockCustomer]))
    )
    const result = await getCustomers()
    expect(result).toEqual([mockCustomer])
  })

  it("returns empty array when results is missing", async () => {
    server.use(
      http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 }))
    )
    const result = await getCustomers()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getCustomers()).rejects.toThrow()
  })

  it("propagates 5xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Server Error" }, { status: 500 })
      )
    )
    await expect(getCustomers()).rejects.toThrow()
  })
})

describe("getCustomer", () => {
  it("fetches a single customer by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockCustomer)))
    const result = await getCustomer(1)
    expect(result).toEqual(mockCustomer)
  })

  it("throws on 404", async () => {
    server.use(
      http.get(`${BASE}/999/`, () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 })
      )
    )
    await expect(getCustomer(999)).rejects.toThrow()
  })
})

describe("createCustomer", () => {
  it("POSTs the payload and returns the created customer", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockCustomer, id: 2 }, { status: 201 })
      })
    )
    const payload = { name: "Nuevo Cliente", customer_type: "person" }
    const result = await createCustomer(payload)
    expect(capturedBody).toMatchObject(payload)
    expect(result.id).toBe(2)
    expect(result.name).toBe("Juan Pérez")
  })
})

describe("updateCustomer", () => {
  it("PUTs the payload and returns the updated customer", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockCustomer, name: "Updated Name" })
      })
    )
    const result = await updateCustomer(1, { name: "Updated Name" })
    expect(capturedBody).toMatchObject({ name: "Updated Name" })
    expect(result.name).toBe("Updated Name")
  })
})

describe("deleteCustomer", () => {
  it("DELETEs the customer and returns the response", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteCustomer(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})

describe("activateCustomer", () => {
  it("PATCHes with is_active=true", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockCustomer, is_active: true })
      })
    )
    const result = await activateCustomer(1)
    expect(capturedBody).toEqual({ is_active: true })
    expect(result.is_active).toBe(true)
  })
})
