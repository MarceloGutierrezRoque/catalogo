import { test, expect } from "./fixtures"
import { E2E_API_URL, E2E_USERNAME, E2E_PASSWORD } from "./constants"

let seededUserId: number
let seededTransportId: number

test.beforeAll(async ({ api }) => {
  // Get the admin user ID from login response (no /api/users/ endpoint)
  const loginResp = await fetch(`${E2E_API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: E2E_USERNAME, password: E2E_PASSWORD }),
  })
  if (!loginResp.ok) throw new Error("Failed to get admin user ID")
  const loginData = await loginResp.json()
  seededUserId = loginData.user.id

  const ts = Date.now()
  seededTransportId = await api.seed("transports", {
    plate: `DRV-${ts}`,
    vehicle_type: "truck",
    brand: "Volvo",
    model: "FH16",
    year: 2024,
    capacity_kg: 20000,
    capacity_volume: 80,
  })
})

test.afterAll(async ({ api }) => {
  await api.remove("transports", seededTransportId)
})

function uid(): string {
  return String(Date.now()).slice(-6)
}

async function ensureOnDrivers(page: import("@playwright/test").Page) {
  await page.goto("/dashboard")
  await page.waitForURL("**/login", { timeout: 5_000 }).catch(() => {})
  if (page.url().includes("/login")) {
    await page.fill("#username", E2E_USERNAME)
    await page.fill("#password", E2E_PASSWORD)
    await page.click("button[type='submit']")
    await page.waitForURL("/dashboard", { timeout: 10_000 })
  }
  await page.getByRole("link", { name: "Conductores" }).click()
  await page.waitForURL("/drivers", { timeout: 10_000 })
  await page.waitForFunction(
    () => !document.body.textContent?.includes("Cargando conductores"),
    { timeout: 10_000 },
  )
  await expect(page.getByRole("heading", { name: "Conductores" })).toBeVisible()
}

async function openNewDialog(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Nuevo Conductor" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
}

async function fillForm(
  page: import("@playwright/test").Page,
  data: {
    license_number: string
    user?: string
    phone?: string
    email?: string
    hire_date?: string
  },
) {
  await page.locator("#license_number").fill(data.license_number)
  if (data.user != null) await page.locator("#user").fill(data.user)
  if (data.phone != null) await page.locator("#phone").fill(data.phone)
  if (data.email != null) await page.locator("#email").fill(data.email)
  if (data.hire_date != null) await page.locator("#hire_date").fill(data.hire_date)
}

async function submitForm(page: import("@playwright/test").Page) {
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: /Crear|Actualizar/ }).click()
}

async function closeDialog(page: import("@playwright/test").Page) {
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 })
}

test.describe("Drivers CRUD", () => {
  test("list renders table with seeded data", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("drivers", {
      user: seededUserId,
      license_number: `LST-${tag}`,
      phone: "+51999000111",
      email: `driver${tag}@test.com`,
      hire_date: "2025-01-15",
      is_available: true,
    })

    try {
      await ensureOnDrivers(page)

      await page.getByPlaceholder("Buscar…").fill(`LST-${tag}`)
      await expect(page.getByText(`User #${seededUserId}`)).toBeVisible()
      await expect(page.getByText("Disponible")).toBeVisible()
    } finally {
      await api.remove("drivers", id)
    }
  })

  test("create driver via form and verify in list", async ({ page, api }) => {
    const tag = uid()
    const license_number = `CRT-${tag}`

    await ensureOnDrivers(page)
    await openNewDialog(page)
    await fillForm(page, {
      license_number,
      user: String(seededUserId),
      phone: "+51988000222",
      email: `create${tag}@test.com`,
      hire_date: "2025-06-01",
    })
    await submitForm(page)
    await closeDialog(page)

    await page.getByPlaceholder("Buscar…").fill(license_number)
    await expect(page.getByText(`User #${seededUserId}`)).toBeVisible()

    const all = await api.list("drivers")
    const created = all.find((d: Record<string, unknown>) => d["license_number"] === license_number)
    if (created) await api.remove("drivers", created.id as number)
  })

  test("validation shows errors on empty form", async ({ page }) => {
    await ensureOnDrivers(page)
    await openNewDialog(page)

    await submitForm(page)

    await expect(page.getByText("El número de licencia es obligatorio")).toBeVisible()
  })

  test("edit driver changes persist in list", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("drivers", {
      user: seededUserId,
      license_number: `EDT-${tag}`,
      phone: "+51999000333",
      email: `edit${tag}@test.com`,
    })

    try {
      await ensureOnDrivers(page)

      await page.getByPlaceholder("Buscar…").fill(`EDT-${tag}`)

      const row = page.getByRole("row").filter({ hasText: `EDT-${tag}` })
      await row.getByRole("button", { name: "Editar" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()

      await page.locator("#license_number").fill(`EDT-After-${tag}`)
      await submitForm(page)
      await closeDialog(page)

      // Re-search by new license code after edit
      await page.getByPlaceholder("Buscar…").fill(`EDT-After-${tag}`)
      await expect(page.getByText(`EDT-After-${tag}`)).toBeVisible()
    } finally {
      await api.remove("drivers", id)
    }
  })

  test("delete driver removes it from list", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("drivers", {
      user: seededUserId,
      license_number: `DEL-${tag}`,
    })

    try {
      await ensureOnDrivers(page)

      await page.getByPlaceholder("Buscar…").fill(`DEL-${tag}`)
      await expect(page.getByText(`DEL-${tag}`)).toBeVisible()

      const row = page.getByRole("row").filter({ hasText: `DEL-${tag}` })
      await row.getByRole("button", { name: "Eliminar" }).click()

      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await dialog.getByRole("button", { name: "Eliminar" }).click()
      await expect(dialog).not.toBeVisible({ timeout: 8_000 })

      await expect(page.getByText(`DEL-${tag}`)).not.toBeVisible()
    } finally {
      try { await api.remove("drivers", id) } catch { /* ignore */ }
    }
  })
})
