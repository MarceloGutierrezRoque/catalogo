import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useSuppliers,
  useSupplier,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useActivateSupplier,
} from "@/hooks/suppliers"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Supplier } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

function wrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useSuppliers", () => {
  it("starts in isPending then returns data on success", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockSupplier])))

    const { result } = renderHook(() => useSuppliers(), { wrapper: wrapper() })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockSupplier])
  })
})

describe("useSupplier", () => {
  it("fetches a single supplier by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockSupplier)))

    const { result } = renderHook(() => useSupplier(1), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockSupplier)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useSupplier(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateSupplier", () => {
  it("invalidates the suppliers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockSupplier, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateSupplier(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ name: "New" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] })
  })
})

describe("useUpdateSupplier", () => {
  it("invalidates the suppliers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.put(`${BASE}/1/`, () => HttpResponse.json(mockSupplier))
    )

    const { result } = renderHook(() => useUpdateSupplier(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] })
  })
})

describe("useDeleteSupplier", () => {
  it("invalidates the suppliers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteSupplier(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] })
  })
})

describe("useActivateSupplier", () => {
  it("invalidates the suppliers query on success (via patchSupplier)", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockSupplier, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateSupplier(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["suppliers"] })
  })
})
