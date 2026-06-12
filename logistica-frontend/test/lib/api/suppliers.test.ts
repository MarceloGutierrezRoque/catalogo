import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  patchSupplier,
  deleteSupplier,
} from "@/services/suppliers"
import type { Supplier } from "@/types/api"

const BASE = `${API_BASE_URL}/suppliers`

const mockSupplier: Supplier = {
  id: 1,
  name: "TecnoSupply S.A.",
  contact_name: "Carlos López",
  email: "carlos@tecnosupply.com",
  phone: "+51999000111",
  address: "Jr. Las Flores 456",
  city: "Arequipa",
  country: "Perú",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getSuppliers", () => {
  it("returns the array from response", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockSupplier])))
    const result = await getSuppliers()
    expect(result).toEqual([mockSupplier])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getSuppliers()).rejects.toThrow()
  })
})

describe("getSupplier", () => {
  it("fetches a single supplier by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockSupplier)))
    const result = await getSupplier(1)
    expect(result).toEqual(mockSupplier)
  })

  it("throws on 404", async () => {
    server.use(
      http.get(`${BASE}/999/`, () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 })
      )
    )
    await expect(getSupplier(999)).rejects.toThrow()
  })
})

describe("createSupplier", () => {
  it("POSTs the payload and returns the created supplier", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSupplier, id: 2 }, { status: 201 })
      })
    )
    const payload = { name: "Nuevo Proveedor" }
    const result = await createSupplier(payload)
    expect(capturedBody).toMatchObject(payload)
    expect(result.id).toBe(2)
  })
})

describe("updateSupplier", () => {
  it("PUTs the payload and returns the updated supplier", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSupplier, name: "Updated" })
      })
    )
    const result = await updateSupplier(1, { name: "Updated" })
    expect(capturedBody).toMatchObject({ name: "Updated" })
    expect(result.name).toBe("Updated")
  })
})

describe("patchSupplier", () => {
  it("PATCHes the payload and returns the patched supplier", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSupplier, phone: "+51999000222" })
      })
    )
    const result = await patchSupplier(1, { phone: "+51999000222" })
    expect(capturedBody).toEqual({ phone: "+51999000222" })
    expect(result.phone).toBe("+51999000222")
  })
})

describe("deleteSupplier", () => {
  it("DELETEs the supplier and returns the response", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteSupplier(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})
