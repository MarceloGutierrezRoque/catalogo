import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  patchShipment,
  getShipmentItems,
  createShipmentItem,
  deleteShipmentItem,
} from "@/services/shipments"
import type { Shipment, ShipmentItem } from "@/types/api"

const BASE = `${API_BASE_URL}/shipments`
const ITEMS_BASE = `${API_BASE_URL}/shipment-items`

const mockItem: ShipmentItem = {
  id: 1,
  shipment: 1,
  product: 1,
  quantity: 10,
  unit_price_at_shipping: "100.00",
}

const mockShipment: Shipment = {
  id: 1,
  tracking_number: "SHP-001",
  customer: 1,
  origin_warehouse: 2,
  destination_address: "Av. Siempre Viva 123",
  destination_city: "Lima",
  destination_country: "Perú",
  status: "pending",
  shipping_date: "2026-01-01T10:00:00Z",
  estimated_delivery_date: "2026-01-05T10:00:00Z",
  actual_delivery_date: null,
  route: null,
  observations: null,
  items: [mockItem],
  is_active: true,
  created_at: "",
  updated_at: "",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getShipments", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockShipment],
        })
      )
    )
    const result = await getShipments()
    expect(result).toEqual([mockShipment])
  })

  it("returns array directly", async () => {
    server.use(
      http.get(`${BASE}/`, () => HttpResponse.json([mockShipment]))
    )
    const result = await getShipments()
    expect(result).toEqual([mockShipment])
  })

  it("returns empty array when results is missing", async () => {
    server.use(
      http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 }))
    )
    const result = await getShipments()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getShipments()).rejects.toThrow()
  })
})

describe("getShipment", () => {
  it("fetches a single shipment by id", async () => {
    server.use(
      http.get(`${BASE}/1/`, () => HttpResponse.json(mockShipment))
    )
    const result = await getShipment(1)
    expect(result).toEqual(mockShipment)
  })
})

describe("createShipment", () => {
  it("POSTs and returns the created shipment", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockShipment, id: 2 }, { status: 201 })
      })
    )
    const result = await createShipment({ tracking_number: "SHP-002" })
    expect(capturedBody).toMatchObject({ tracking_number: "SHP-002" })
    expect(result.id).toBe(2)
  })
})

describe("updateShipment", () => {
  it("PUTs and returns the updated shipment", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockShipment, status: "in_transit" })
      })
    )
    const result = await updateShipment(1, { status: "in_transit" })
    expect(capturedBody).toMatchObject({ status: "in_transit" })
    expect(result.status).toBe("in_transit")
  })
})

describe("deleteShipment", () => {
  it("DELETEs the shipment", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteShipment(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})

describe("patchShipment", () => {
  it("PATCHes with partial data", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockShipment, is_active: false })
      })
    )
    const result = await patchShipment(1, { is_active: false })
    expect(capturedBody).toEqual({ is_active: false })
    expect(result.is_active).toBe(false)
  })
})

// ── ShipmentItem API ──

describe("getShipmentItems", () => {
  it("returns items for a given shipment", async () => {
    server.use(
      http.get(`${ITEMS_BASE}/`, () =>
        HttpResponse.json({ count: 1, results: [mockItem] })
      )
    )
    const result = await getShipmentItems(1)
    expect(result).toEqual([mockItem])
  })

  it("passes shipment as query param", async () => {
    let capturedUrl = ""
    server.use(
      http.get(`${ITEMS_BASE}/`, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([mockItem])
      })
    )
    await getShipmentItems(1)
    expect(capturedUrl).toContain("shipment=1")
  })

  it("returns all items when no shipment id given", async () => {
    server.use(
      http.get(`${ITEMS_BASE}/`, () => HttpResponse.json([mockItem, { ...mockItem, id: 2 }]))
    )
    const result = await getShipmentItems()
    expect(result).toHaveLength(2)
  })
})

describe("createShipmentItem", () => {
  it("POSTs and returns the created item", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${ITEMS_BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockItem, { status: 201 })
      })
    )
    const result = await createShipmentItem({ shipment: 1, product: 1, quantity: 10 })
    expect(capturedBody).toMatchObject({ shipment: 1, product: 1, quantity: 10 })
    expect(result.id).toBe(1)
  })
})

describe("deleteShipmentItem", () => {
  it("DELETEs the item", async () => {
    let called = false
    server.use(
      http.delete(`${ITEMS_BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteShipmentItem(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})
