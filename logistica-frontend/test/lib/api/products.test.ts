import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
} from "@/services/products"
import type { Product } from "@/types/api"

const BASE = `${API_BASE_URL}/products`

const mockProduct: Product = {
  id: 1,
  name: "Laptop Gamer X1",
  sku: "LAP-X1-001",
  description: "Laptop de alta gama",
  category: "Electrónica",
  brand: "TechBrand",
  unit_price: "4999.99",
  weight: "2.500",
  dimensions: "35x25x2",
  stock_quantity: 50,
  min_stock_level: 10,
  supplier: { id: 1, name: "TecnoSupply" },
  warehouse: { id: 1, name: "Almacén Central" },
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getProducts", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockProduct],
        })
      )
    )
    const result = await getProducts()
    expect(result).toEqual([mockProduct])
  })

  it("returns array directly when response is an array", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockProduct])))
    const result = await getProducts()
    expect(result).toEqual([mockProduct])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getProducts()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getProducts()).rejects.toThrow()
  })
})

describe("getProduct", () => {
  it("fetches a single product by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockProduct)))
    const result = await getProduct(1)
    expect(result).toEqual(mockProduct)
  })

  it("throws on 404", async () => {
    server.use(
      http.get(`${BASE}/999/`, () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 })
      )
    )
    await expect(getProduct(999)).rejects.toThrow()
  })
})

describe("createProduct", () => {
  it("POSTs the payload and returns the created product", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockProduct, id: 2 }, { status: 201 })
      })
    )
    const payload = { name: "Nuevo Producto", sku: "NEW-001" }
    const result = await createProduct(payload)
    expect(capturedBody).toMatchObject(payload)
    expect(result.id).toBe(2)
  })
})

describe("updateProduct", () => {
  it("PUTs the payload and returns the updated product", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockProduct, name: "Updated" })
      })
    )
    const result = await updateProduct(1, { name: "Updated" })
    expect(capturedBody).toMatchObject({ name: "Updated" })
    expect(result.name).toBe("Updated")
  })
})

describe("patchProduct", () => {
  it("PATCHes the payload and returns the patched product", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockProduct, stock_quantity: 25 })
      })
    )
    const result = await patchProduct(1, { stock_quantity: 25 })
    expect(capturedBody).toEqual({ stock_quantity: 25 })
    expect(result.stock_quantity).toBe(25)
  })
})

describe("deleteProduct", () => {
  it("DELETEs the product and returns the response", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteProduct(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})
