import { test, expect } from "@playwright/test"
import { E2E_USERNAME, E2E_PASSWORD } from "./constants"

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.fill("#username", E2E_USERNAME)
  await page.fill("#password", E2E_PASSWORD)
  await page.click("button[type='submit']")
  await page.waitForURL("/dashboard", { timeout: 10_000 })
}

test.describe("Login", () => {
  test("valid credentials redirect to /dashboard and show layout", async ({ page }) => {
    await page.goto("/login")
    await page.fill("#username", E2E_USERNAME)
    await page.fill("#password", E2E_PASSWORD)
    await page.click("button[type='submit']")

    await page.waitForURL("/dashboard", { timeout: 10_000 })

    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Almacenes" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Menú de usuario" })).toBeVisible()
  })

  test("invalid credentials show error and stay on /login", async ({ page }) => {
    await page.goto("/login")
    await page.fill("#username", "usuario_que_no_existe")
    await page.fill("#password", "password_incorrecta")
    await page.click("button[type='submit']")

    const toast = page.locator("[data-sonner-toast][data-type='error']")
    await expect(toast).toBeVisible({ timeout: 8_000 })

    await expect(page).toHaveURL("/login")
  })

  test("no token redirects to /login when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL("/login", { timeout: 10_000 })
  })
})

test.describe("Active session", () => {
  test("logout clears tokens and redirects to /login", async ({ page }) => {
    await login(page)

    await page.getByRole("button", { name: "Menú de usuario" }).click()
    await page.getByRole("menuitem", { name: "Cerrar Sesión" }).click()

    await page.waitForURL("/login", { timeout: 10_000 })

    const accessToken = await page.evaluate(() => localStorage.getItem("access_token"))
    expect(accessToken).toBeNull()

    await page.goto("/dashboard")
    await page.waitForURL("/login", { timeout: 10_000 })
  })

  test("(opcional) expired access token refreshes without expelling user", async ({ page }) => {
    await login(page)

    const refreshToken = await page.evaluate(() => localStorage.getItem("refresh_token"))
    expect(refreshToken).toBeTruthy()

    await page.evaluate(() => {
      localStorage.setItem("access_token", "expired_token_for_test")
    })

    await page.goto("/dashboard")

    await expect(page).toHaveURL("/dashboard", { timeout: 10_000 })

    await page.waitForFunction(
      () => localStorage.getItem("access_token") !== "expired_token_for_test",
      { timeout: 10_000 },
    )

    const newAccess = await page.evaluate(() => localStorage.getItem("access_token"))
    expect(newAccess).toBeTruthy()
  })
})
