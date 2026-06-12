import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  activateWarehouse,
} from "@/services/warehouse"
import type { Warehouse } from "@/types/api"

const BASE = `${API_BASE_URL}/warehouses`

const mockWarehouse: Warehouse = {
  id: 1,
  name: "Almacén Central",
  code: "WH-001",
  address: "Av. Industrial 456",
  city: "Lima",
  country: "Perú",
  capacity: 10000,
  is_active: true,
  created_at: "",
  updated_at: "",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getWarehouses", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [mockWarehouse] })
      )
    )
    const result = await getWarehouses()
    expect(result).toEqual([mockWarehouse])
  })

  it("returns array directly", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockWarehouse])))
    const result = await getWarehouses()
    expect(result).toEqual([mockWarehouse])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getWarehouses()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getWarehouses()).rejects.toThrow()
  })
})

describe("getWarehouse", () => {
  it("fetches a single warehouse by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockWarehouse)))
    const result = await getWarehouse(1)
    expect(result).toEqual(mockWarehouse)
  })
})

describe("createWarehouse", () => {
  it("POSTs and returns the created warehouse", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockWarehouse, id: 2 }, { status: 201 })
      })
    )
    const result = await createWarehouse({ name: "Nuevo Almacén" })
    expect(capturedBody).toMatchObject({ name: "Nuevo Almacén" })
    expect(result.id).toBe(2)
  })
})

describe("updateWarehouse", () => {
  it("PUTs and returns the updated warehouse", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockWarehouse, name: "Updated" })
      })
    )
    const result = await updateWarehouse(1, { name: "Updated" })
    expect(capturedBody).toMatchObject({ name: "Updated" })
    expect(result.name).toBe("Updated")
  })
})

describe("deleteWarehouse", () => {
  it("DELETEs the warehouse", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteWarehouse(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})

describe("activateWarehouse", () => {
  it("PATCHes with is_active=true", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockWarehouse, is_active: true })
      })
    )
    const result = await activateWarehouse(1)
    expect(capturedBody).toEqual({ is_active: true })
    expect(result.is_active).toBe(true)
  })
})
