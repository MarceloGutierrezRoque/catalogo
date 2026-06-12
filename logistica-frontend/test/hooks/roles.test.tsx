import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useGroups,
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from "@/hooks/groups"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { Group } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = `${API_BASE_URL}/auth/groups`

const mockGroup: Group = {
  id: 1,
  name: "Administradores",
  permissions: [1, 2, 3],
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

describe("useGroups", () => {
  it("returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, results: [mockGroup] })
      )
    )
    const { result } = renderHook(() => useGroups(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockGroup])
  })
})

describe("useGroup", () => {
  it("fetches a single group by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockGroup)))
    const { result } = renderHook(() => useGroup(1), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockGroup)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useGroup(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateGroup", () => {
  it("invalidates groups query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockGroup, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateGroup(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ name: "New Role" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["groups"] })
  })
})

describe("useUpdateGroup", () => {
  it("invalidates groups query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(http.put(`${BASE}/1/`, () => HttpResponse.json(mockGroup)))

    const { result } = renderHook(() => useUpdateGroup(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { name: "Updated" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["groups"] })
  })
})

describe("useDeleteGroup", () => {
  it("invalidates groups query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteGroup(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["groups"] })
  })
})
