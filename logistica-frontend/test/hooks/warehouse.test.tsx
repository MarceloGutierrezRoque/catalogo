import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useWarehouses,
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  useActivateWarehouse,
} from "@/hooks/warehouse"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Warehouse } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

function wrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useWarehouses", () => {
  it("returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, results: [mockWarehouse] })
      )
    )
    const { result } = renderHook(() => useWarehouses(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockWarehouse])
  })
})

describe("useWarehouse", () => {
  it("fetches a single warehouse by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockWarehouse)))
    const { result } = renderHook(() => useWarehouse(1), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockWarehouse)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useWarehouse(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateWarehouse", () => {
  it("invalidates warehouses query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockWarehouse, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateWarehouse(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ name: "New" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
  })
})

describe("useUpdateWarehouse", () => {
  it("invalidates warehouses query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(http.put(`${BASE}/1/`, () => HttpResponse.json(mockWarehouse)))

    const { result } = renderHook(() => useUpdateWarehouse(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
  })
})

describe("useDeleteWarehouse", () => {
  it("invalidates warehouses query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteWarehouse(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
  })
})

describe("useActivateWarehouse", () => {
  it("invalidates warehouses query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockWarehouse, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateWarehouse(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
  })
})
