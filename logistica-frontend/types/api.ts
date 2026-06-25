export interface Warehouse {
  id: number
  name: string
  code: string
  address: string | null
  city: string | null
  country: string | null
  capacity: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  sku: string
  description: string | null
  category: string | null
  brand: string | null
  unit_price: string | null
  weight: string | null
  dimensions: string | null
  stock_quantity: number
  min_stock_level: number
  supplier: number | { id: number; name: string } | null
  warehouse: number | { id: number; name: string } | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  name: string
  customer_type: string
  document_type: string | null
  document_number: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ShipmentItem {
  id: number
  shipment: number
  product: number
  quantity: number
  unit_price_at_shipping: string
}

export interface Shipment {
  id: number
  tracking_number: string
  customer: number
  origin_warehouse: number
  destination_address: string
  destination_city: string
  destination_country: string
  status: "pending" | "picked_up" | "in_transit" | "delivered" | "cancelled"
  shipping_date: string | null
  estimated_delivery_date: string | null
  actual_delivery_date: string | null
  route: number | null
  observations: string | null
  items: ShipmentItem[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Driver {
  id: number
  user: number
  license_number: string
  phone: string | null
  email: string | null
  hire_date: string | null
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transport {
  id: number
  plate: string
  vehicle_type: string | null
  brand: string | null
  model: string | null
  year: number | null
  capacity_kg: string | null
  capacity_volume: string | null
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Stop {
  id: number
  route: number
  order: number
  warehouse: number
  arrival_time: string | null
  departure_time: string | null
  status: "pending" | "arrived" | "completed"
}

export interface Route {
  id: number
  name: string
  transport: number
  driver: number
  start_date: string | null
  end_date: string | null
  status: "planned" | "in_progress" | "completed" | "cancelled"
  stops: Stop[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  groups: number[]
  date_joined: string
  last_login: string | null
}

export interface Group {
  id: number
  name: string
  permissions: number[]
}

export interface Permission {
  id: number
  name: string
  codename: string
  content_type: number
  app_label: string
  model_name: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: {
    id: number
    username: string
    email: string
    is_superuser: boolean
    is_staff: boolean
    permissions: string[]
  }
}

export interface Profile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
  is_staff: boolean
  date_joined: string
  last_login: string | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface Payment {
  id: number
  product: number
  stripe_session_id: string
  stripe_payment_intent_id: string | null
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "refunded"
  customer_email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CheckoutSessionRequest {
  items: { product_id: number; quantity?: number }[]
  success_url: string
  cancel_url: string
  customer_email?: string
}

export interface CheckoutSessionResponse {
  session_id: string
  session_url: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
