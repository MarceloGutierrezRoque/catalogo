import { test as setup, expect } from "@playwright/test"
import { E2E_API_URL, E2E_USERNAME, E2E_PASSWORD } from "./constants"

const AUTH_FILE = "playwright/.auth/user.json"

setup("authenticate via API + seed localStorage", async ({ page, request }) => {
  const resp = await request.post(`${E2E_API_URL}/auth/login/`, {
    data: { username: E2E_USERNAME, password: E2E_PASSWORD },
  })
  expect(resp.ok()).toBeTruthy()
  const body = await resp.json()
  const { access, refresh } = body

  await page.goto("/")
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem("access_token", access)
      localStorage.setItem("refresh_token", refresh)
    },
    { access, refresh },
  )

  await page.context().storageState({ path: AUTH_FILE })
})
