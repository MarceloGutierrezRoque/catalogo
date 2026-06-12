import { describe, expect, it, beforeEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/test/msw/server"
import { API_BASE_URL } from "@/lib/constants"
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
} from "@/services/groups"
import type { Group } from "@/types/api"

const BASE = `${API_BASE_URL}/auth/groups`

const mockGroup: Group = {
  id: 1,
  name: "Administradores",
  permissions: [1, 2, 3],
}

beforeEach(() => {
  server.resetHandlers()
})

describe("getGroups", () => {
  it("returns parsed results from PaginatedResponse", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [mockGroup] })
      )
    )
    const result = await getGroups()
    expect(result).toEqual([mockGroup])
  })

  it("returns array directly", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json([mockGroup])))
    const result = await getGroups()
    expect(result).toEqual([mockGroup])
  })

  it("returns empty array when results is missing", async () => {
    server.use(http.get(`${BASE}/`, () => HttpResponse.json({ count: 0 })))
    const result = await getGroups()
    expect(result).toEqual([])
  })

  it("propagates 4xx errors", async () => {
    server.use(
      http.get(`${BASE}/`, () =>
        HttpResponse.json({ detail: "Forbidden" }, { status: 403 })
      )
    )
    await expect(getGroups()).rejects.toThrow()
  })
})

describe("getGroup", () => {
  it("fetches a single group by id", async () => {
    server.use(http.get(`${BASE}/1/`, () => HttpResponse.json(mockGroup)))
    const result = await getGroup(1)
    expect(result).toEqual(mockGroup)
  })
})

describe("createGroup", () => {
  it("POSTs and returns the created group", async () => {
    let capturedBody: unknown
    server.use(
      http.post(`${BASE}/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockGroup, id: 2 }, { status: 201 })
      })
    )
    const result = await createGroup({ name: "Nuevo Rol" })
    expect(capturedBody).toMatchObject({ name: "Nuevo Rol" })
    expect(result.id).toBe(2)
  })
})

describe("updateGroup", () => {
  it("PUTs and returns the updated group", async () => {
    let capturedBody: unknown
    server.use(
      http.put(`${BASE}/1/`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockGroup, name: "Updated" })
      })
    )
    const result = await updateGroup(1, { name: "Updated" })
    expect(capturedBody).toMatchObject({ name: "Updated" })
    expect(result.name).toBe("Updated")
  })
})

describe("deleteGroup", () => {
  it("DELETEs the group", async () => {
    let called = false
    server.use(
      http.delete(`${BASE}/1/`, () => {
        called = true
        return HttpResponse.json(null, { status: 204 })
      })
    )
    const result = await deleteGroup(1)
    expect(called).toBe(true)
    expect(result).toBe("")
  })
})
