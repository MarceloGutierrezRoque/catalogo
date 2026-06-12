import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useTransports,
  useTransport,
  useCreateTransport,
  useUpdateTransport,
  useDeleteTransport,
  useActivateTransport,
} from "@/hooks/transports"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Transport } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = `${API_BASE_URL}/transports`

const mockTransport: Transport = {
  id: 1,
  plate: "ABC-123",
  vehicle_type: "truck",
  brand: "Toyota",
  model: "Hilux",
  year: 2020,
  capacity_kg: "1500.00",
  capacity_volume: "10.00",
  is_available: true,
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

describe("useTransports", () => {
  it("returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, results: [mockTransport] })
      )
    )
    const { result } = renderHook(() => useTransports(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockTransport])
  })
})

describe("useTransport", () => {
  it("fetches a single transport by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockTransport)))
    const { result } = renderHook(() => useTransport(1), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTransport)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useTransport(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateTransport", () => {
  it("invalidates transports query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockTransport, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateTransport(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ plate: "NEW-001" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] })
  })
})

describe("useUpdateTransport", () => {
  it("invalidates transports query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(http.put(`${BASE}/1/`, () => HttpResponse.json(mockTransport)))

    const { result } = renderHook(() => useUpdateTransport(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { plate: "UPD-001" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] })
  })
})

describe("useDeleteTransport", () => {
  it("invalidates transports query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteTransport(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] })
  })
})

describe("useActivateTransport", () => {
  it("invalidates transports query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockTransport, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateTransport(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["transports"] })
  })
})
