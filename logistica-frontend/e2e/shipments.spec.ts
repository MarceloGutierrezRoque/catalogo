import { test, expect } from "./fixtures"
import { E2E_API_URL, E2E_USERNAME, E2E_PASSWORD } from "./constants"

let seededWarehouseId: number
let seededCustomerId: number
let seededSupplierId: number
let seededProductId: number
let seededTransportId: number
let seededDriverId: number
let seededUserId: number

let customerLabel: string
let warehouseLabel: string
let productLabel: string
let productName: string

test.beforeAll(async ({ api }) => {
  const loginResp = await fetch(`${E2E_API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: E2E_USERNAME, password: E2E_PASSWORD }),
  })
  if (!loginResp.ok) throw new Error("Failed to get admin user ID")
  const loginData = await loginResp.json()
  seededUserId = loginData.user.id

  const ts = Date.now()

  seededWarehouseId = await api.seed("warehouses", {
    name: `WH SHP ${ts}`,
    code: `WH-SHP-${ts}`,
    address: "Av. Shipment 123",
    city: "Lima",
    country: "Perú",
    capacity: 5000,
  })

  seededCustomerId = await api.seed("customers", {
    name: `Cust SHP ${ts}`,
    customer_type: "company",
    document_type: "ruc",
    document_number: `${ts}`.slice(0, 11).padStart(11, "0"),
    email: `shp${ts}@test.com`,
    phone: "+51999000111",
    address: "Jr. Customer 456",
    city: "Lima",
    country: "Perú",
  })

  seededSupplierId = await api.seed("suppliers", {
    name: `Supp SHP ${ts}`,
    contact_name: "Contact",
    email: `supplier${ts}@test.com`,
    phone: "+51999000222",
    address: "Av. Supplier 789",
    city: "Lima",
    country: "Perú",
  })

  seededProductId = await api.seed("products", {
    name: `Prod SHP ${ts}`,
    sku: `SHP-SKU-${ts}`,
    description: "Shipment test product",
    category: "General",
    unit_price: "100.00",
    supplier: seededSupplierId,
    warehouse: seededWarehouseId,
  })

  seededTransportId = await api.seed("transports", {
    plate: `SHP-${ts}`,
    vehicle_type: "truck",
    brand: "Volvo",
    model: "FH16",
    year: 2024,
    capacity_kg: 20000,
    capacity_volume: 80,
  })

  seededDriverId = await api.seed("drivers", {
    user: seededUserId,
    license_number: `SHP-DRV-${ts}`,
    phone: "+51999000333",
    email: `shpdrv${ts}@test.com`,
  })

  warehouseLabel = `WH SHP ${ts} (#${seededWarehouseId})`
  customerLabel = `Cust SHP ${ts} (#${seededCustomerId})`
  productName = `Prod SHP ${ts}`
  productLabel = `${productName} (SKU: SHP-SKU-${ts})`
})

test.afterAll(async ({ api }) => {
  const removals = [
    api.remove("drivers", seededDriverId),
    api.remove("transports", seededTransportId),
    api.remove("products", seededProductId),
    api.remove("suppliers", seededSupplierId),
    api.remove("customers", seededCustomerId),
    api.remove("warehouses", seededWarehouseId),
  ]
  for (const p of removals) {
    try { await p } catch { }
  }
})

function uid(): string {
  return String(Date.now()).slice(-6)
}

async function ensureOnShipments(page: import("@playwright/test").Page) {
  await page.goto("/dashboard")
  await page.waitForURL("**/login", { timeout: 5_000 }).catch(() => {})
  if (page.url().includes("/login")) {
    await page.fill("#username", E2E_USERNAME)
    await page.fill("#password", E2E_PASSWORD)
    await page.click("button[type='submit']")
    await page.waitForURL("/dashboard", { timeout: 10_000 })
  }
  await page.getByRole("link", { name: "Envíos" }).click()
  await page.waitForURL("/shipments", { timeout: 10_000 })
  await page.waitForFunction(
    () => !document.body.textContent?.includes("Cargando envíos"),
    { timeout: 10_000 },
  )
  await expect(page.getByRole("heading", { name: "Envíos" })).toBeVisible()
}

async function selectOption(
  page: import("@playwright/test").Page,
  placeholder: string,
  optionText: string,
) {
  await page.locator('[data-slot="select-trigger"]').filter({ hasText: placeholder }).click()
  await page.getByRole("option", { name: optionText }).click()
}

async function addProductItem(
  page: import("@playwright/test").Page,
  productLabel: string,
  quantity: string,
  price?: string,
) {
  await page.getByRole("button", { name: /Agregar Producto/ }).click()
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 })
  await selectOption(page, "Seleccionar producto…", productLabel)
  await page.locator("#item_quantity").fill(quantity)
  if (price) await page.locator("#item_price").fill(price)
  await page.getByRole("dialog").getByRole("button", { name: "Agregar" }).click()
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 })
}

async function fillShipmentForm(
  page: import("@playwright/test").Page,
  data: {
    tracking: string
    destAddress: string
    destCity: string
    destCountry: string
    shippingDate?: string
    estimatedDelivery?: string
  },
  items: Array<{ productLabel: string; quantity: string; price?: string }>,
) {
  await page.locator("#tracking_number").fill(data.tracking)
  await selectOption(page, "Seleccionar cliente…", customerLabel)
  await selectOption(page, "Seleccionar almacén…", warehouseLabel)
  await page.locator("#destination_address").fill(data.destAddress)
  await page.locator("#destination_city").fill(data.destCity)
  await page.locator("#destination_country").fill(data.destCountry)
  if (data.shippingDate) await page.locator("#shipping_date").fill(data.shippingDate)
  if (data.estimatedDelivery) await page.locator("#estimated_delivery").fill(data.estimatedDelivery)
  for (const item of items) {
    await addProductItem(page, item.productLabel, item.quantity, item.price)
  }
}

async function submitAndWait(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Guardar Envío" }).click()
  await page.waitForFunction(() => window.location.pathname === "/shipments", { timeout: 15_000 })
}

async function submitChangesAndWait(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Guardar Cambios" }).click()
  // Wait for either success or error toast
  const success = page.getByText("Envío actualizado exitosamente")
  const error = page.getByText("Error al guardar el envío")
  const result = await Promise.race([
    success.waitFor({ state: "visible", timeout: 15_000 }).then(() => "success"),
    error.waitFor({ state: "visible", timeout: 15_000 }).then(() => "error"),
  ])
  if (result === "error") {
    const text = await page.evaluate(() => document.body.textContent || "")
    // Find all text between "Error" and common punctuation
    const errs = text.match(/[Ee]rror[^.!;]*[.!;]/g)?.map(e => e.trim()) ?? []
    throw new Error(`API save failed. Errors: ${JSON.stringify(errs)}`)
  }
  await page.waitForFunction(() => window.location.pathname === "/shipments", { timeout: 5_000 })
}

async function waitForLoadingDone(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => !document.body.textContent?.includes("Cargando envío"),
    { timeout: 10_000 },
  )
}

test.describe("Shipments CRUD", () => {
  test("list renders table with seeded data", async ({ page, api }) => {
    const tag = uid()
    const tracking = `SHP-LST-${tag}`
    const shpId = await api.seed("shipments", {
      tracking_number: tracking,
      customer: seededCustomerId,
      origin_warehouse: seededWarehouseId,
      destination_address: "Av. Test 123",
      destination_city: "Cusco",
      destination_country: "Perú",
      status: "pending",
      shipping_date: "2026-06-01",
      estimated_delivery_date: "2026-06-10",
    })
    await api.seed("shipment-items", {
      shipment: shpId,
      product: seededProductId,
      quantity: 3,
      unit_price_at_shipping: "100.00",
    })

    try {
      await ensureOnShipments(page)

      await page.getByPlaceholder("Buscar…").fill(tracking)
      await expect(page.getByText(tracking)).toBeVisible()
      await expect(page.getByText("Pendiente")).toBeVisible()
    } finally {
      try { await api.remove("shipments", shpId) } catch { }
    }
  })

  test("create shipment via form and verify in list", async ({ page, api }) => {
    const tag = uid()
    const tracking = `SHP-CRT-${tag}`

    await ensureOnShipments(page)
    await page.getByRole("button", { name: "Nuevo Envío" }).click()
    await page.waitForURL("/shipments/new", { timeout: 10_000 })

    await fillShipmentForm(
      page,
      {
        tracking,
        destAddress: "Av. Created 456",
        destCity: "Arequipa",
        destCountry: "Perú",
        shippingDate: "2026-06-15",
        estimatedDelivery: "2026-06-20",
      },
      [{ productLabel, quantity: "10", price: "150.00" }],
    )

    await submitAndWait(page)

    await page.getByPlaceholder("Buscar…").fill(tracking)
    await expect(page.getByText(tracking)).toBeVisible()

    // Cleanup via API
    const all = await api.list("shipments")
    const created = all.find((s: Record<string, unknown>) => s["tracking_number"] === tracking)
    if (created) {
      try { await api.remove("shipments", created.id as number) } catch { }
    }
  })

  test("validation prevents submission on empty form", async ({ page }) => {
    await ensureOnShipments(page)
    await page.getByRole("button", { name: "Nuevo Envío" }).click()
    await page.waitForURL("/shipments/new", { timeout: 10_000 })

    // Button has data-disabled because all required fields are empty
    await expect(page.getByRole("button", { name: "Guardar Envío" })).toHaveAttribute("data-disabled", "")
  })

  test("add and remove items in shipment edit", async ({ page, api }) => {
    const tag = uid()
    const tracking = `SHP-RM-${tag}`
    const shpId = await api.seed("shipments", {
      tracking_number: tracking,
      customer: seededCustomerId,
      origin_warehouse: seededWarehouseId,
      destination_address: "Av. Remove 789",
      destination_city: "Cusco",
      destination_country: "Perú",
      status: "pending",
    })
    await api.seed("shipment-items", {
      shipment: shpId,
      product: seededProductId,
      quantity: 5,
      unit_price_at_shipping: "100.00",
    })

    try {
      await ensureOnShipments(page)

      // Navigate to edit page via tracking link in list
      await page.getByPlaceholder("Buscar…").fill(tracking)
      await expect(page.getByText(tracking)).toBeVisible()
      await page.getByRole("link", { name: tracking }).click()
      await page.waitForURL(`**/shipments/${shpId}`, { timeout: 10_000 })
      await expect(page.getByText("Editar Envío")).toBeVisible()

      // Verify existing item shown
      await expect(page.getByRole("cell", { name: "5", exact: true })).toBeVisible()

      // Add a new item via dialog (so we have 2 items, can remove 1 and still save)
      await addProductItem(page, productLabel, "10", "200.00")

      // Remove the first item (qty 5)
      await page.getByRole("table").getByRole("button", { name: "Eliminar" }).first().click()
      await expect(page.getByRole("cell", { name: "10", exact: true })).toBeVisible()
      await expect(page.getByRole("cell", { name: "5", exact: true })).not.toBeVisible()

      // Save: should delete the removed item and create the remaining one
      await submitChangesAndWait(page)

      // Verify still in list
      await page.getByPlaceholder("Buscar…").fill(tracking)
      await expect(page.getByText(tracking)).toBeVisible()
    } finally {
      try { await api.remove("shipments", shpId) } catch { }
    }
  })

  test("status transition via edit", async ({ page, api }) => {
    const tag = uid()
    const tracking = `SHP-STA-${tag}`
    const shpId = await api.seed("shipments", {
      tracking_number: tracking,
      customer: seededCustomerId,
      origin_warehouse: seededWarehouseId,
      destination_address: "Av. Status 123",
      destination_city: "Lima",
      destination_country: "Perú",
      status: "pending",
    })
    await api.seed("shipment-items", {
      shipment: shpId,
      product: seededProductId,
      quantity: 1,
      unit_price_at_shipping: "100.00",
    })

    try {
      await ensureOnShipments(page)

      // Navigate to edit page via tracking link in list
      await page.getByPlaceholder("Buscar…").fill(tracking)
      await expect(page.getByText(tracking)).toBeVisible()
      await page.getByRole("link", { name: tracking }).click()
      await page.waitForURL(`**/shipments/${shpId}`, { timeout: 10_000 })
      await expect(page.getByText("Editar Envío")).toBeVisible()

      // Change status via select — use nth(0) for first status trigger (edit form, not list filter)
      const statusTrigger = page.locator('[data-slot="select-trigger"]').filter({ hasText: "Pendiente" })
      await statusTrigger.click()
      await page.getByRole("option", { name: "En tránsito" }).click()

      // Save
      await submitChangesAndWait(page)

      // Verify in list: search by tracking and check status badge
      await page.getByPlaceholder("Buscar…").fill(tracking)
      const row = page.getByRole("row").filter({ hasText: tracking })
      await expect(row.getByText("En tránsito")).toBeVisible()
    } finally {
      try { await api.remove("shipments", shpId) } catch { }
    }
  })

  test("delete shipment removes it from list", async ({ page, api }) => {
    const tag = uid()
    const tracking = `SHP-DEL-${tag}`
    const shpId = await api.seed("shipments", {
      tracking_number: tracking,
      customer: seededCustomerId,
      origin_warehouse: seededWarehouseId,
      destination_address: "Av. Delete 123",
      destination_city: "Lima",
      destination_country: "Perú",
      status: "pending",
    })
    await api.seed("shipment-items", {
      shipment: shpId,
      product: seededProductId,
      quantity: 1,
      unit_price_at_shipping: "100.00",
    })

    try {
      await ensureOnShipments(page)

      await page.getByPlaceholder("Buscar…").fill(tracking)
      await expect(page.getByText(tracking)).toBeVisible()

      // Click delete button in the row
      const row = page.getByRole("row").filter({ hasText: tracking })
      await row.getByRole("button", { name: "Eliminar" }).click()

      // Confirm in dialog
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await dialog.getByRole("button", { name: "Eliminar" }).click()
      await expect(dialog).not.toBeVisible({ timeout: 8_000 })

      // Soft-delete: shipment may still show as inactive
      await expect(page.getByText(tracking)).not.toBeVisible()
    } finally {
      try { await api.remove("shipments", shpId) } catch { }
    }
  })
})
