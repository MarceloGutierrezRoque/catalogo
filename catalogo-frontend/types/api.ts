export interface Plushie {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  stock: number;
  click_count: number;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  plushie_id?: number;
  plushie_name: string;
  quantity: number;
  unit_price: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  observations: string | null;
  status: "pending" | "contacted" | "closed" | "cancelled";
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderCreatePayload {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  observations?: string;
  items: { plushie_id: number; quantity: number }[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

// ---- Admin Users ----

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  password?: string; // Opcional en edición — solo se actualiza si se envía
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_active?: boolean;
}

export interface DashboardStats {
  orders: {
    pending: number;
    contacted: number;
    closed: number;
    cancelled: number;
    total: number;
  };
  plushies: {
    active: number;
    inactive: number;
    total: number;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- Auth ----

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

// ---- Admin Plushies ----

export interface AdminPlushieCreatePayload {
  name: string;
  description?: string | null;
  price: string;
  stock: number;
  is_active?: boolean;
  image?: File | null;
}

export interface AdminPlushieUpdatePayload {
  name?: string;
  description?: string | null;
  price?: string;
  stock?: number;
  is_active?: boolean;
  image?: File | null;
}

/** Payload decodificado del JWT access token */
export interface JwtPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  username?: string;
  email?: string;
}

// ---- Admin Orders ----

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["contacted", "closed", "cancelled"],
  contacted: ["pending", "closed", "cancelled"],
  closed: ["pending", "contacted", "cancelled"],
  cancelled: ["pending", "contacted", "closed"],
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  contacted: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  closed: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export interface AdminOrderUpdatePayload {
  status: string;
}
