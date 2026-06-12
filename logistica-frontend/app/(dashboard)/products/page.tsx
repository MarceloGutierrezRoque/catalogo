"use client"

import { useState, useMemo } from "react"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useActivateProduct,
} from "@/hooks/products"
import { useSuppliers } from "@/hooks/suppliers"
import { useWarehouses } from "@/hooks/warehouse"
import type { Product } from "@/types/api"
import { type SortingState } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/components/data-table"
import { productColumns } from "@/components/columns/products"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { MobileFilterSheet } from "@/components/mobile-filter-sheet"
import { useAuthStore } from "@/stores/auth"

interface FormErrors {
  name?: string
  sku?: string
  description?: string
  category?: string
  brand?: string
  unit_price?: string
  weight?: string
  dimensions?: string
  stock_quantity?: string
  min_stock_level?: string
  supplier?: string
  warehouse?: string
}

export default function ProductsPage() {
  const { data: products, isLoading, isError, refetch } = useProducts()
  const { data: suppliers } = useSuppliers()
  const { data: warehouses } = useWarehouses()
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()
  const activateMutation = useActivateProduct()
  const can = useAuthStore((s) => s.can)

  const supplierItems = useMemo(
    () => Object.fromEntries((suppliers ?? []).map((s) => [String(s.id), s.name])),
    [suppliers],
  )
  const warehouseItems = useMemo(
    () => Object.fromEntries((warehouses ?? []).map((w) => [String(w.id), w.name])),
    [warehouses],
  )

  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formSku, setFormSku] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formBrand, setFormBrand] = useState("")
  const [formUnitPrice, setFormUnitPrice] = useState("")
  const [formWeight, setFormWeight] = useState("")
  const [formDimensions, setFormDimensions] = useState("")
  const [formStockQuantity, setFormStockQuantity] = useState("")
  const [formMinStock, setFormMinStock] = useState("")
  const [formSupplier, setFormSupplier] = useState("")
  const [formWarehouse, setFormWarehouse] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Table columns ──

  const columns = productColumns({ can, openEditDialog, setDeleteTarget, handleActivate, activateMutation })

  // ── Data ──

  const productList = products ?? []

  // ── Dialog handlers ──

  function openCreateDialog() {
    setErrors({})
    setEditingProduct(null)
    setFormName("")
    setFormSku("")
    setFormDescription("")
    setFormCategory("")
    setFormBrand("")
    setFormUnitPrice("")
    setFormWeight("")
    setFormDimensions("")
    setFormStockQuantity("")
    setFormMinStock("")
    setFormSupplier("")
    setFormWarehouse("")
    setDialogOpen(true)
  }

  function openEditDialog(product: Product) {
    setErrors({})
    setEditingProduct(product)
    setFormName(product.name)
    setFormSku(product.sku)
    setFormDescription(product.description ?? "")
    setFormCategory(product.category ?? "")
    setFormBrand(product.brand ?? "")
    setFormUnitPrice(product.unit_price ?? "")
    setFormWeight(product.weight ?? "")
    setFormDimensions(product.dimensions ?? "")
    setFormStockQuantity(String(product.stock_quantity))
    setFormMinStock(String(product.min_stock_level))
    if (product.supplier === null) {
      setFormSupplier("")
    } else if (typeof product.supplier === "object") {
      setFormSupplier(String(product.supplier.id))
    } else {
      setFormSupplier(String(product.supplier))
    }
    if (product.warehouse === null) {
      setFormWarehouse("")
    } else if (typeof product.warehouse === "object") {
      setFormWarehouse(String(product.warehouse.id))
    } else {
      setFormWarehouse(String(product.warehouse))
    }
    setDialogOpen(true)
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!formName.trim()) errs.name = "El nombre es obligatorio"
    if (!formSku.trim()) errs.sku = "El SKU es obligatorio"
    return errs
  }

  function clearError(field: keyof FormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const payload: Partial<Product> = {
      name: formName,
      sku: formSku,
      description: formDescription || null,
      category: formCategory || null,
      brand: formBrand || null,
      unit_price: formUnitPrice || null,
      weight: formWeight || null,
      dimensions: formDimensions || null,
      stock_quantity: formStockQuantity ? Number(formStockQuantity) : 0,
      min_stock_level: formMinStock ? Number(formMinStock) : 0,
      supplier: formSupplier ? Number(formSupplier) : null,
      warehouse: formWarehouse ? Number(formWarehouse) : null,
    }

    if (editingProduct) {
      updateMutation.mutate(
        { id: editingProduct.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      createMutation.mutate(payload as Partial<Product>, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  function handleActivate(id: number) {
    activateMutation.mutate(id)
  }

  // ── Loading / Error states ──

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">Cargando productos…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-lg font-bold text-destructive">!</span>
        </div>
        <div>
          <p className="font-medium text-destructive">Error al cargar productos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifica la conexión con el servidor e intenta nuevamente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administra los productos registrados en el sistema
          </p>
        </div>
        {can("products.add_product") && (
          <Button onClick={openCreateDialog} size="lg" className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Producto
          </Button>
        )}
      </div>

      <MobileFilterSheet
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        placeholder="Buscar por nombre, SKU, categoría…"
      />

      <DataTable
        columns={columns}
        data={productList}
        sorting={sorting}
        onSortingChange={setSorting}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        emptyMessage="No hay productos registrados"
        filteredEmptyMessage="No se encontraron productos"
        noDataHint='Presiona "Nuevo Producto" para crear el primero'
      />

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Modifica los datos del producto"
                : "Ingresa los datos del nuevo producto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name & SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    clearError("name")
                  }}
                  placeholder="Laptop Gamer X1"
                  required
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formSku}
                  onChange={(e) => {
                    setFormSku(e.target.value)
                    clearError("sku")
                  }}
                  placeholder="LAP-X1-001"
                  required
                />
                {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
              </div>
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value)
                    clearError("category")
                  }}
                  placeholder="Electrónica"
                />
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formBrand}
                  onChange={(e) => {
                    setFormBrand(e.target.value)
                    clearError("brand")
                  }}
                  placeholder="TechBrand"
                />
                {errors.brand && <p className="text-sm text-destructive">{errors.brand}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => {
                  setFormDescription(e.target.value)
                  clearError("description")
                }}
                placeholder="Descripción del producto…"
                rows={2}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            {/* Supplier & Warehouse - Selects */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor</Label>
                <Select
                  value={formSupplier}
                  onValueChange={(v) => {
                    setFormSupplier(v ?? "")
                    clearError("supplier")
                  }}
                  items={supplierItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar proveedor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier && <p className="text-sm text-destructive">{errors.supplier}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Almacén</Label>
                <Select
                  value={formWarehouse}
                  onValueChange={(v) => {
                    setFormWarehouse(v ?? "")
                    clearError("warehouse")
                  }}
                  items={warehouseItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar almacén…" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.warehouse && <p className="text-sm text-destructive">{errors.warehouse}</p>}
              </div>
            </div>

            {/* Unit price & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">Precio unitario (S/)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formUnitPrice}
                  onChange={(e) => {
                    setFormUnitPrice(e.target.value)
                    clearError("unit_price")
                  }}
                  placeholder="4999.99"
                />
                {errors.unit_price && <p className="text-sm text-destructive">{errors.unit_price}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formWeight}
                  onChange={(e) => {
                    setFormWeight(e.target.value)
                    clearError("weight")
                  }}
                  placeholder="2.500"
                />
                {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensiones</Label>
              <Input
                id="dimensions"
                value={formDimensions}
                onChange={(e) => {
                  setFormDimensions(e.target.value)
                  clearError("dimensions")
                }}
                placeholder="35x25x2"
              />
              {errors.dimensions && <p className="text-sm text-destructive">{errors.dimensions}</p>}
            </div>

            {/* Stock & Min stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock actual</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={formStockQuantity}
                  onChange={(e) => {
                    setFormStockQuantity(e.target.value)
                    clearError("stock_quantity")
                  }}
                  placeholder="50"
                />
                {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Stock mínimo</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  min="0"
                  value={formMinStock}
                  onChange={(e) => {
                    setFormMinStock(e.target.value)
                    clearError("min_stock_level")
                  }}
                  placeholder="10"
                />
                {errors.min_stock_level && <p className="text-sm text-destructive">{errors.min_stock_level}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isMutating}
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : editingProduct ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Eliminar Producto</DialogTitle>
                <DialogDescription className="mt-1">
                  ¿Estás seguro? Esta acción desactivará{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.name}
                  </span>
                  .
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                "Eliminar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
