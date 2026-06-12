import { test, expect } from "./fixtures"
import { E2E_USERNAME, E2E_PASSWORD } from "./constants"

function uid(): string {
  return String(Date.now()).slice(-6)
}

async function ensureOnWarehouses(page: import("@playwright/test").Page) {
  // Navigate through /dashboard first (direct /warehouses 404s in dev mode)
  await page.goto("/dashboard")
  // React strict mode may cause async redirect to /login; wait for redirect to settle
  await page.waitForURL("**/login", { timeout: 5_000 }).catch(() => {})
  if (page.url().includes("/login")) {
    await page.fill("#username", E2E_USERNAME)
    await page.fill("#password", E2E_PASSWORD)
    await page.click("button[type='submit']")
    await page.waitForURL("/dashboard", { timeout: 10_000 })
  }
  // Use sidebar link to navigate to warehouses (the route is /warehouses)
  await page.getByRole("link", { name: "Almacenes" }).click()
  await page.waitForURL("/warehouses", { timeout: 10_000 })
  // Wait for loading to finish
  await page.waitForFunction(
    () => !document.body.textContent?.includes("Cargando almacenes"),
    { timeout: 10_000 },
  )
  await expect(page.getByRole("heading", { name: "Almacenes" })).toBeVisible()
}

async function openNewDialog(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Nuevo Almacén" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
}

async function fillForm(
  page: import("@playwright/test").Page,
  data: { name: string; code: string; address?: string; city?: string; country?: string; capacity?: string },
) {
  await page.locator("#name").fill(data.name)
  await page.locator("#code").fill(data.code)
  if (data.address) await page.locator("#address").fill(data.address)
  if (data.city) await page.locator("#city").fill(data.city)
  if (data.country) await page.locator("#country").fill(data.country)
  if (data.capacity != null) await page.locator("#capacity").fill(data.capacity)
}

async function submitForm(page: import("@playwright/test").Page) {
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: /Crear|Actualizar/ }).click()
}

async function closeDialog(page: import("@playwright/test").Page) {
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 })
}

// ── Tests ─────────────────────────────────────────────────────────────────

test.describe("Warehouses CRUD", () => {
  test("list renders table with seeded data", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("warehouses", {
      name: `List Test WH ${tag}`,
      code: `LST-${tag}`,
      address: "Av. List 123",
      city: "Lima",
      country: "Perú",
      capacity: 5000,
    })

    try {
      await ensureOnWarehouses(page)

      // Search by unique code to find the row (data may be on later pages)
      await page.getByPlaceholder("Buscar por nombre, código, dirección…").fill(`LST-${tag}`)
      await expect(page.getByText(`List Test WH ${tag}`)).toBeVisible()
    } finally {
      await api.remove("warehouses", id)
    }
  })

  test("create warehouse via form and verify in list", async ({ page, api }) => {
    const tag = uid()
    const name = `Create WH ${tag}`
    const code = `CRT-${tag}`

    await ensureOnWarehouses(page)
    await openNewDialog(page)
    await fillForm(page, { name, code, address: "Av. Create 456", city: "Arequipa", country: "Perú", capacity: "3000" })
    await submitForm(page)
    await closeDialog(page)

    // Search by code to find the new row (may be on later pages)
    await page.getByPlaceholder("Buscar por nombre, código, dirección…").fill(code)
    await expect(page.getByText(name)).toBeVisible()

    // Cleanup: find by code via api.list and remove
    const all = await api.list("warehouses")
    const created = all.find((w) => w.code === code)
    if (created) await api.remove("warehouses", created.id as number)
  })

  test("validation shows errors on empty form", async ({ page }) => {
    await ensureOnWarehouses(page)
    await openNewDialog(page)

    // Submit empty form
    await submitForm(page)

    await expect(page.getByText("El nombre es obligatorio")).toBeVisible()
    await expect(page.getByText("El código es obligatorio")).toBeVisible()
  })

  test("edit warehouse changes persist in list", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("warehouses", {
      name: `Edit Before ${tag}`,
      code: `EDT-${tag}`,
      address: "Av. Edit 789",
      city: "Cusco",
      country: "Perú",
    })

    try {
      await ensureOnWarehouses(page)

      // Search by unique code to find the row (data may be on later pages)
      await page.getByPlaceholder("Buscar por nombre, código, dirección…").fill(`EDT-${tag}`)

      // Click edit button for this row
      const row = page.getByRole("row").filter({ hasText: `EDT-${tag}` })
      await row.getByRole("button", { name: "Editar" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()

      // Change name
      await page.locator("#name").fill(`Edit After ${tag}`)
      await submitForm(page)
      await closeDialog(page)

      await expect(page.getByText(`Edit After ${tag}`)).toBeVisible()
    } finally {
      await api.remove("warehouses", id)
    }
  })

  test("delete warehouse removes it from list", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("warehouses", {
      name: `Delete WH ${tag}`,
      code: `DEL-${tag}`,
    })

    try {
      await ensureOnWarehouses(page)

      // Search by unique code to find the row (data may be on later pages)
      await page.getByPlaceholder("Buscar por nombre, código, dirección…").fill(`DEL-${tag}`)
      await expect(page.getByText(`Delete WH ${tag}`)).toBeVisible()

      // Click delete button
      const row = page.getByRole("row").filter({ hasText: `DEL-${tag}` })
      await row.getByRole("button", { name: "Eliminar" }).click()

      // Confirm in the dialog
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await dialog.getByRole("button", { name: "Eliminar" }).click()
      await expect(dialog).not.toBeVisible({ timeout: 8_000 })

      // Hard-delete: row removed from list
      await expect(page.getByText(`Delete WH ${tag}`)).not.toBeVisible()
    } finally {
      // Already deleted, but try to clean up in case the test failed before delete
      try { await api.remove("warehouses", id) } catch { /* ignore */ }
    }
  })

  test("search/filter narrows results", async ({ page, api }) => {
    const tag = uid()
    const id1 = await api.seed("warehouses", { name: `Alpha WH ${tag}`, code: `ALPHA-${tag}` })
    const id2 = await api.seed("warehouses", { name: `Beta WH ${tag}`, code: `BETA-${tag}` })

    try {
      await ensureOnWarehouses(page)

      // Search by unique code to find seeded rows (may be on later pages)
      await page.getByPlaceholder("Buscar por nombre, código, dirección…").fill(tag)
      await expect(page.getByText(`Alpha WH ${tag}`)).toBeVisible()
      await expect(page.getByText(`Beta WH ${tag}`)).toBeVisible()

      // Type "Alpha" to filter further — Beta should disappear
      const searchInput = page.getByPlaceholder("Buscar por nombre, código, dirección…")
      await searchInput.fill(`Alpha`)

      await expect(page.getByText(`Alpha WH ${tag}`)).toBeVisible()
      await expect(page.getByText(`Beta WH ${tag}`)).not.toBeVisible()
    } finally {
      await api.remove("warehouses", id1)
      await api.remove("warehouses", id2)
    }
  })
})
