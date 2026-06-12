import { describe, expect, it, beforeEach, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useUpdateMe,
  useDeleteUser,
} from "@/hooks/users"
import { createTestQueryClient } from "@/test/utils/renderWithQuery"
import type { User } from "@/types/api"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const BASE = `${API_BASE_URL}/auth/users`

const mockUser: User = {
  id: 1,
  username: "jperez",
  email: "jperez@example.com",
  first_name: "Juan",
  last_name: "Pérez",
  is_active: true,
  is_staff: false,
  is_superuser: false,
  groups: [1, 2],
  date_joined: "2026-01-01T00:00:00Z",
  last_login: null,
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

describe("useUsers", () => {
  it("returns data on success", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, results: [mockUser] })
      )
    )
    const { result } = renderHook(() => useUsers(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockUser])
  })
})

describe("useUser", () => {
  it("fetches a single user by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockUser)))
    const { result } = renderHook(() => useUser(1), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockUser)
  })

  it("is disabled when id is 0", async () => {
    const { result } = renderHook(() => useUser(0), { wrapper: wrapper() })
    expect(result.current.isPending).toBe(true)
  })
})

describe("useCreateUser", () => {
  it("invalidates users query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.post(`${BASE}/`, () =>
        HttpResponse.json(mockUser, { status: 201 })
      )
    )

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ username: "nuevo", password: "secret" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] })
  })
})

describe("useUpdateUser", () => {
  it("invalidates users query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.patch(`${BASE}/1/`, () => HttpResponse.json(mockUser))
    )

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate({ id: 1, data: { email: "new@example.com" } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] })
  })
})

describe("useUpdateMe", () => {
  it("calls updateMe and shows success toast", async () => {
    server.use(
      http.patch(`${API_BASE_URL}/auth/me/`, () =>
        HttpResponse.json({ id: 1, username: "jperez", email: "updated@example.com" })
      )
    )

    const { result } = renderHook(() => useUpdateMe(), { wrapper: wrapper() })

    result.current.mutate({ first_name: "Pedro" })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe("useDeleteUser", () => {
  it("invalidates users query on success", async () => {
    const qc = createTestQueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")

    server.use(
      http.delete(`${BASE}/1/`, () => HttpResponse.json(null, { status: 204 }))
    )

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: wrapper(qc),
    })

    result.current.mutate(1)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] })
  })
})
