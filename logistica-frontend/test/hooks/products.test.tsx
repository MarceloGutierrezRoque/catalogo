import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useActivateProduct,
} from "@/hooks/products"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Product } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

function wrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useProducts", () => {
  it("starts in isPending then returns data on success", async () => {
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

    const { result } = renderHook(() => useProducts(), { wrapper: wrapper() })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockProduct])
  })
})

describe("useProduct", () => {
  it("fetches a single product by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockProduct)))

    const { result } = renderHook(() => useProduct(1), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProduct)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useProduct(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateProduct", () => {
  it("invalidates the products query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockProduct, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateProduct(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ name: "New", sku: "NEW-001" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] })
  })
})

describe("useUpdateProduct", () => {
  it("invalidates the products query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.put(`${BASE}/1/`, () => HttpResponse.json(mockProduct))
    )

    const { result } = renderHook(() => useUpdateProduct(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Updated" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] })
  })
})

describe("useDeleteProduct", () => {
  it("invalidates the products query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteProduct(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] })
  })
})

describe("useActivateProduct", () => {
  it("invalidates the products query on success (via patchProduct)", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockProduct, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateProduct(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["products"] })
  })
})
