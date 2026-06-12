import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useRoutes,
  useRoute,
  useCreateRoute,
  useUpdateRoute,
  useDeleteRoute,
  useActivateRoute,
  useCreateStop,
  useDeleteStop,
} from "@/hooks/routes"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Route, Stop } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = `${API_BASE_URL}/routes`
const STOPS_BASE = `${API_BASE_URL}/stops`

const mockStop: Stop = {
  id: 1,
  route: 1,
  order: 1,
  warehouse: 1,
  arrival_time: "2026-01-01T10:00:00Z",
  departure_time: "2026-01-01T11:00:00Z",
  status: "completed",
}

const mockRoute: Route = {
  id: 1,
  name: "Ruta Lima-Arequipa",
  transport: 1,
  driver: 1,
  start_date: "2026-01-01T08:00:00Z",
  end_date: "2026-01-02T18:00:00Z",
  status: "planned",
  stops: [mockStop],
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

describe("useRoutes", () => {
  it("starts in isPending then returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [mockRoute],
        })
      )
    )

    const { result } = renderHook(() => useRoutes(), { wrapper: wrapper() })

    expect(result.current.isPending).toBe(true)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockRoute])
  })
})

describe("useRoute", () => {
  it("fetches a single route by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockRoute)))

    const { result } = renderHook(() => useRoute(1), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockRoute)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useRoute(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateRoute", () => {
  it("invalidates the routes query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockRoute, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateRoute(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ name: "New" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] })
  })
})

describe("useUpdateRoute", () => {
  it("invalidates both list and single route queries", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(http.put(`${BASE}/1/`, () => HttpResponse.json(mockRoute)))

    const { result } = renderHook(() => useUpdateRoute(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes", 1] })
  })
})

describe("useDeleteRoute", () => {
  it("invalidates the routes query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteRoute(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] })
  })
})

describe("useActivateRoute", () => {
  it("invalidates the routes query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () =>
        HttpResponse.json({ ...mockRoute, is_active: true })
      )
    )

    const { result } = renderHook(() => useActivateRoute(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] })
  })
})

describe("useCreateStop", () => {
  it("invalidates both routes list and single route on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${STOPS_BASE}/`, () =>
        HttpResponse.json(mockStop, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateStop(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ route: 1, order: 1, warehouse: 1 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes", 1] })
  })
})

describe("useDeleteStop", () => {
  it("invalidates the routes query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${STOPS_BASE}/1/`, () =>
        HttpResponse.json(null, { status: 204 })
      )
    )

    const { result } = renderHook(() => useDeleteStop(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["routes"] })
  })
})
