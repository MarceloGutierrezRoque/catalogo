"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import type { Plushie } from "@/types/api";
import type { AdminPlushieCreatePayload, AdminPlushieUpdatePayload } from "@/types/api";

// Schema de validación
const plushieSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable().optional(),
  price: z
    .string()
    .min(1, "El precio es requerido")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      { message: "El precio debe ser mayor a 0" }
    ),
  stock: z
    .string()
    .min(1, "El stock es requerido")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)),
      { message: "El stock debe ser un número entero >= 0" }
    ),
  is_active: z.boolean().optional(),
});

type PlushieFormValues = z.infer<typeof plushieSchema>;

interface PlushieFormProps {
  initialData?: Plushie;
  onSubmit: (data: AdminPlushieCreatePayload | AdminPlushieUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function PlushieForm({ initialData, onSubmit, isSubmitting }: PlushieFormProps) {
  const isEditing = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image ?? null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PlushieFormValues>({
    resolver: zodResolver(plushieSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? "",
      stock: initialData?.stock?.toString() ?? "0",
      is_active: initialData?.is_active ?? true,
    },
  });

  const currentIsActive = watch("is_active");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFormSubmit = (values: PlushieFormValues) => {
    const payload: Record<string, unknown> = {
      name: values.name,
      description: values.description || null,
      price: values.price,
      stock: Number(values.stock),
    };

    if (isEditing) {
      payload.is_active = values.is_active;
    } else {
      payload.is_active = true; // por defecto activo al crear
    }

    // Manejo de imagen
    if (imageFile) {
      payload.image = imageFile;
    } else if (removeImage) {
      payload.image = null;
    }
    // Si no hay cambios en imagen, no incluimos el campo (para edición)

    onSubmit(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar peluche" : "Nuevo peluche"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Modifica los datos del peluche"
            : "Completa los datos para agregar un nuevo peluche"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Ej: Pikachu Peluche Gigante"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Descripción del peluche..."
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Precio y Stock en grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Precio (S/) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="25.99"
                {...register("price")}
              />
              {errors.price && (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">
                Stock <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                step="1"
                min="0"
                placeholder="10"
                {...register("stock")}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          {/* Imagen */}
          <div className="space-y-2">
            <Label>Imagen</Label>

            {imagePreview && (
              <div className="relative inline-block">
                <div className="h-40 w-40 rounded-md overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute -top-2 -right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {!imagePreview && (
              <div
                className="flex items-center justify-center h-40 w-40 rounded-md border border-dashed bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Click para subir
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Activo (solo en edición) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 rounded border-gray-300"
                checked={currentIsActive ?? true}
                onChange={(e) => setValue("is_active", e.target.checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Peluche activo (visible en el catálogo público)
              </Label>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? "Guardando..."
                : isEditing
                ? "Guardar cambios"
                : "Crear peluche"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
