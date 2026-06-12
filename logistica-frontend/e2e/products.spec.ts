import { test, expect } from "./fixtures"
import { E2E_USERNAME, E2E_PASSWORD } from "./constants"

let seededSupplierId: number
let seededSupplierName: string
let seededWarehouseId: number
let seededWarehouseName: string

test.beforeAll(async ({ api }) => {
  const ts = Date.now()
  seededSupplierName = `Test Supplier ${ts}`
  seededSupplierId = await api.seed("suppliers", {
    name: seededSupplierName,
    contact_name: "Test Contact",
    email: `supplier${ts}@test.com`,
    phone: "999999999",
    address: "Av. Supplier 123",
    city: "Lima",
    country: "Perú",
  })
  seededWarehouseName = `Test Warehouse ${ts}`
  seededWarehouseId = await api.seed("warehouses", {
    name: seededWarehouseName,
    code: `WH-${ts}`,
    address: "Av. Warehouse 123",
    city: "Lima",
    country: "Perú",
    capacity: 5000,
  })
})

test.afterAll(async ({ api }) => {
  await api.remove("warehouses", seededWarehouseId)
  await api.remove("suppliers", seededSupplierId)
})

function uid(): string {
  return String(Date.now()).slice(-6)
}

async function ensureOnProducts(page: import("@playwright/test").Page) {
  await page.goto("/dashboard")
  await page.waitForURL("**/login", { timeout: 5_000 }).catch(() => {})
  if (page.url().includes("/login")) {
    await page.fill("#username", E2E_USERNAME)
    await page.fill("#password", E2E_PASSWORD)
    await page.click("button[type='submit']")
    await page.waitForURL("/dashboard", { timeout: 10_000 })
  }
  await page.getByRole("link", { name: "Productos" }).click()
  await page.waitForURL("/products", { timeout: 10_000 })
  await page.waitForFunction(
    () => !document.body.textContent?.includes("Cargando productos"),
    { timeout: 10_000 },
  )
  await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible()
}

async function openNewDialog(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Nuevo Producto" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
}

async function fillForm(
  page: import("@playwright/test").Page,
  data: {
    name: string
    sku: string
    description?: string
    category?: string
    brand?: string
    unit_price?: string
    weight?: string
    dimensions?: string
    stock_quantity?: string
    min_stock_level?: string
  },
) {
  await page.locator("#name").fill(data.name)
  await page.locator("#sku").fill(data.sku)
  if (data.description) await page.locator("#description").fill(data.description)
  if (data.category) await page.locator("#category").fill(data.category)
  if (data.brand) await page.locator("#brand").fill(data.brand)
  if (data.unit_price != null) await page.locator("#unit_price").fill(data.unit_price)
  if (data.weight != null) await page.locator("#weight").fill(data.weight)
  if (data.dimensions) await page.locator("#dimensions").fill(data.dimensions)
  if (data.stock_quantity != null) await page.locator("#stock_quantity").fill(data.stock_quantity)
  if (data.min_stock_level != null) await page.locator("#min_stock_level").fill(data.min_stock_level)
}

async function selectOption(
  page: import("@playwright/test").Page,
  labelText: string,
  optionText: string,
) {
  const dialog = page.getByRole("dialog")
  const placeholder = labelText === "Proveedor" ? "Seleccionar proveedor" : "Seleccionar almacén"
  await dialog.locator(`[data-slot="select-trigger"]`).filter({ hasText: placeholder }).click()
  await page.getByRole("option", { name: optionText }).click()
}

async function submitForm(page: import("@playwright/test").Page) {
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: /Crear|Actualizar/ }).click()
}

async function closeDialog(page: import("@playwright/test").Page) {
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 8_000 })
}

test.describe("Products CRUD", () => {
  test("list renders table with seeded data", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("products", {
      name: `List Test Product ${tag}`,
      sku: `LST-${tag}`,
      supplier: seededSupplierId,
      warehouse: seededWarehouseId,
    })

    try {
      await ensureOnProducts(page)

      await page.getByPlaceholder("Buscar por nombre, SKU, categoría…").fill(`LST-${tag}`)
      await expect(page.getByText(`List Test Product ${tag}`)).toBeVisible()
    } finally {
      await api.remove("products", id)
    }
  })

  test("create product via form and verify in list", async ({ page, api }) => {
    const tag = uid()
    const name = `Create Product ${tag}`
    const sku = `CRT-${tag}`

    await ensureOnProducts(page)
    await openNewDialog(page)
    await fillForm(page, { name, sku, category: "Electrónica", brand: "TestBrand", unit_price: "99.99", stock_quantity: "10", min_stock_level: "2" })
    await selectOption(page, "Proveedor", seededSupplierName)
    await selectOption(page, "Almacén", seededWarehouseName)
    await submitForm(page)
    await closeDialog(page)

    await page.getByPlaceholder("Buscar por nombre, SKU, categoría…").fill(sku)
    await expect(page.getByText(name)).toBeVisible()

    const all = await api.list("products")
    const created = all.find((p) => p["sku"] === sku)
    if (created) await api.remove("products", created.id as number)
  })

  test("validation shows errors on empty form", async ({ page }) => {
    await ensureOnProducts(page)
    await openNewDialog(page)

    await submitForm(page)

    await expect(page.getByText("El nombre es obligatorio")).toBeVisible()
    await expect(page.getByText("El SKU es obligatorio")).toBeVisible()
  })

  test("edit product changes persist in list", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("products", {
      name: `Edit Before ${tag}`,
      sku: `EDT-${tag}`,
      supplier: seededSupplierId,
      warehouse: seededWarehouseId,
    })

    try {
      await ensureOnProducts(page)

      await page.getByPlaceholder("Buscar por nombre, SKU, categoría…").fill(`EDT-${tag}`)

      const row = page.getByRole("row").filter({ hasText: `EDT-${tag}` })
      await row.getByRole("button", { name: "Editar" }).click()
      await expect(page.getByRole("dialog")).toBeVisible()

      await page.locator("#name").fill(`Edit After ${tag}`)
      await submitForm(page)
      await closeDialog(page)

      await expect(page.getByText(`Edit After ${tag}`)).toBeVisible()
    } finally {
      await api.remove("products", id)
    }
  })

  test("delete product removes it from list", async ({ page, api }) => {
    const tag = uid()
    const id = await api.seed("products", {
      name: `Delete Product ${tag}`,
      sku: `DEL-${tag}`,
      supplier: seededSupplierId,
      warehouse: seededWarehouseId,
    })

    try {
      await ensureOnProducts(page)

      await page.getByPlaceholder("Buscar por nombre, SKU, categoría…").fill(`DEL-${tag}`)
      await expect(page.getByText(`Delete Product ${tag}`)).toBeVisible()

      const row = page.getByRole("row").filter({ hasText: `DEL-${tag}` })
      await row.getByRole("button", { name: "Eliminar" }).click()

      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await dialog.getByRole("button", { name: "Eliminar" }).click()
      await expect(dialog).not.toBeVisible({ timeout: 8_000 })

      await expect(page.getByText(`Delete Product ${tag}`)).not.toBeVisible()
    } finally {
      try { await api.remove("products", id) } catch { /* ignore */ }
    }
  })

  test("duplicate SKU shows error and keeps dialog open", async ({ page, api }) => {
    const tag = uid()
    const sku = `SKU-DUP-${tag}`

    // Create first product
    const id = await api.seed("products", {
      name: `Original ${tag}`,
      sku,
      supplier: seededSupplierId,
      warehouse: seededWarehouseId,
    })

    try {
      await ensureOnProducts(page)
      await openNewDialog(page)

      await fillForm(page, { name: `Duplicate ${tag}`, sku })
      await selectOption(page, "Proveedor", seededSupplierName)
      await selectOption(page, "Almacén", seededWarehouseName)
      await submitForm(page)

      await expect(page.getByRole("dialog")).toBeVisible()

      await expect(page.getByText("Error al crear el producto")).toBeVisible()
    } finally {
      await api.remove("products", id)
    }
  })
})
