import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  patchUser,
  updateMe,
  deleteUser,
} from "@/services/users"
import type { User, Profile } from "@/types/api"

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

describe("getUsers", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [mockUser] })
      )
    )
    const result = await getUsers()
    expect(result).toEqual([mockUser])
  })

  it("returns array directly", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockUser])))
    const result = await getUsers()
    expect(result).toEqual([mockUser])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getUsers()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getUsers()).rejects.toThrow()
  })
})

describe("getUser", () => {
  it("fetches a single user by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockUser)))
    const result = await getUser(1)
    expect(result).toEqual(mockUser)
  })
})

describe("createUser", () => {
  it("POSTs with password and returns the created user", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockUser, id: 2 }, { status: 201 })
      })
    )
    const result = await createUser({ username: "nuevo", password: "secret123" })
    expect(capturedBody).toMatchObject({ username: "nuevo", password: "secret123" })
    expect(result.id).toBe(2)
  })
})

describe("updateUser", () => {
  it("PUTs and returns the updated user", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockUser, email: "updated@example.com" })
      })
    )
    const result = await updateUser(1, { email: "updated@example.com" })
    expect(capturedBody).toMatchObject({ email: "updated@example.com" })
    expect(result.email).toBe("updated@example.com")
  })
})

describe("patchUser", () => {
  it("PATCHes with partial data", async () => {
    let capturedBody: unknown
    server.use(
      http.patch(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockUser, is_active: false })
      })
    )
    const result = await patchUser(1, { is_active: false })
    expect(capturedBody).toEqual({ is_active: false })
    expect(result.is_active).toBe(false)
  })
})

describe("updateMe", () => {
  it("PATCHes to /auth/me/ and returns the profile", async () => {
    let capturedBody: unknown
    const mockProfile: Profile = {
      id: 1,
      username: "jperez",
      email: "jperez@example.com",
      first_name: "Juan",
      last_name: "Pérez",
      is_superuser: false,
      is_staff: false,
      date_joined: "2026-01-01T00:00:00Z",
      last_login: null,
    }
    server.use(
      http.patch(`${API_BASE_URL}/auth/me/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockProfile, first_name: "Pedro" })
      })
    )
    const result = await updateMe({ first_name: "Pedro" })
    expect(capturedBody).toEqual({ first_name: "Pedro" })
    expect(result.first_name).toBe("Pedro")
  })
})

describe("deleteUser", () => {
  it("DELETEs the user", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteUser(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})
