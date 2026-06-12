import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useCustomers,
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useActivateCustomer,
} from "@/hooks/customers"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Customer } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

function wrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }
}

describe("useCustomers", () => {
  it("starts in isPending state then returns data on success", async () => {
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

    const { result } = renderHook(() => useCustomers(), {
      wrapper: wrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([mockCustomer])
  })

  it("uses the correct queryKey", async () => {
    const qc = createTestQueryClient()
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 0, results: [] })
      )
    )

    renderHook(() => useCustomers(), { wrapper: wrapper(qc) })

    await waitFor(() => {
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })
})

describe("useCustomer", () => {
  it("fetches a single customer by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockCustomer)))

    const { result } = renderHook(() => useCustomer(1), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCustomer)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useCustomer(0), { wrapper: wrapper() })

    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateCustomer", () => {
  it("invalidates the customers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockCustomer, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateCustomer(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ name: "New", customer_type: "company" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] })
  })
})

describe("useUpdateCustomer", () => {
  it("invalidates the customers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.put(`${BASE}/1/`, () =>
        HttpResponse.json(mockCustomer)
      )
    )

    const { result } = renderHook(() => useUpdateCustomer(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Updated" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] })
  })
})

describe("useDeleteCustomer", () => {
  it("invalidates the customers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteCustomer(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] })
  })
})

describe("useActivateCustomer", () => {
  it("invalidates the customers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockCustomer, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateCustomer(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["customers"] })
  })
})
