import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useDrivers,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  useActivateDriver,
} from "@/hooks/drivers"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Driver } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = `${API_BASE_URL}/drivers`

const mockDriver: Driver = {
  id: 1,
  user: 10,
  license_number: "LIC-001",
  phone: "+51999000111",
  email: "conductor@logistica.com",
  hire_date: "2025-01-15",
  is_available: true,
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

describe("useDrivers", () => {
  it("starts in isPending then returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockDriver],
        })
      )
    )

    const { result } = renderHook(() => useDrivers(), { wrapper: wrapper() })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockDriver])
  })
})

describe("useDriver", () => {
  it("fetches a single driver by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockDriver)))

    const { result } = renderHook(() => useDriver(1), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockDriver)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useDriver(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateDriver", () => {
  it("invalidates the drivers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockDriver, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateDriver(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ license_number: "LIC-002" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] })
  })
})

describe("useUpdateDriver", () => {
  it("invalidates the drivers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.put(`${BASE}/1/`, () => HttpResponse.json(mockDriver))
    )

    const { result } = renderHook(() => useUpdateDriver(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { phone: "+51999000222" } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] })
  })
})

describe("useDeleteDriver", () => {
  it("invalidates the drivers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteDriver(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] })
  })
})

describe("useActivateDriver", () => {
  it("invalidates the drivers query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockDriver, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateDriver(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["drivers"] })
  })
})
