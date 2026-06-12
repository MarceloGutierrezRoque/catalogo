import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  activateRoute,
  createStop,
  deleteStop,
} from "@/services/routes"
import type { Route } from "@/types/api"

// ── Route hooks ──

export function useRoutes() {
  return useQuery({
    queryKey: ["routes"],
    queryFn: getRoutes,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRoute(id: number) {
  return useQuery({
    queryKey: ["routes", id],
    queryFn: () => getRoute(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Route>) => createRoute(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Ruta creada exitosamente")
    },
    onError: () => {
      toast.error("Error al crear la ruta")
    },
  })
}

export function useUpdateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Route> }) =>
      updateRoute(id, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      qc.invalidateQueries({ queryKey: ["routes", variables.id] })
      toast.success("Ruta actualizada exitosamente")
    },
    onError: () => {
      toast.error("Error al actualizar la ruta")
    },
  })
}

export function useDeleteRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Ruta eliminada exitosamente")
    },
    onError: () => {
      toast.error("Error al eliminar la ruta")
    },
  })
}

export function useActivateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => activateRoute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Ruta activada exitosamente")
    },
    onError: () => {
      toast.error("Error al activar la ruta")
    },
  })
}

// ── Stop hooks ──

export function useCreateStop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      route: number
      order: number
      warehouse: number
      arrival_time?: string | null
      departure_time?: string | null
      status?: string
    }) => createStop(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      qc.invalidateQueries({ queryKey: ["routes", variables.route] })
      toast.success("Parada agregada a la ruta")
    },
    onError: () => {
      toast.error("Error al agregar la parada")
    },
  })
}

export function useDeleteStop() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteStop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routes"] })
      toast.success("Parada eliminada de la ruta")
    },
    onError: () => {
      toast.error("Error al eliminar la parada")
    },
  })
}
