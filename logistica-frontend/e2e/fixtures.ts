import { test as base } from "@playwright/test"
import { E2E_API_URL, E2E_USERNAME, E2E_PASSWORD } from "./constants"

type ApiFixtures = {
  api: {
    seed: (endpoint: string, payload: Record<string, unknown>) => Promise<number>
    remove: (endpoint: string, id: number) => Promise<void>
    list: (endpoint: string) => Promise<Record<string, unknown>[]>
  }
}

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    const resp = await fetch(`${E2E_API_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: E2E_USERNAME, password: E2E_PASSWORD }),
    })
    if (!resp.ok) throw new Error(`Auth failed for fixtures: ${resp.status}`)
    const { access } = await resp.json()

    const seed = async (endpoint: string, payload: Record<string, unknown>) => {
      const res = await fetch(`${E2E_API_URL}/${endpoint}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`seed ${endpoint} failed: ${res.status} ${await res.text()}`)
      const data = await res.json()
      return data.id
    }

    const remove = async (endpoint: string, id: number) => {
      const res = await fetch(`${E2E_API_URL}/${endpoint}/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${access}` },
      })
      if (!res.ok) throw new Error(`remove ${endpoint}/${id} failed: ${res.status}`)
    }

    const list = async (endpoint: string) => {
      const res = await fetch(`${E2E_API_URL}/${endpoint}/`, {
        headers: { Authorization: `Bearer ${access}` },
      })
      if (!res.ok) throw new Error(`list ${endpoint} failed: ${res.status}`)
      const data = await res.json()
      return Array.isArray(data) ? data : (data.results ?? [])
    }

    await use({ seed, remove, list })
  },
})

export { expect } from "@playwright/test"
