export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface UserInfo {
  id: number
  store_id: number
  username: string
  name: string
  phone?: string
  role: string
  avatar_url?: string
  store?: {
    id: number
    name: string
    code?: string
  }
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  token_type: string
  user: UserInfo
}

export interface Customer {
  id: number
  store_id: number
  name: string
  phone: string
  gender?: number
  source?: string
  remark?: string
  total_spent: number
  visit_count: number
  last_visit_at?: string
  created_at: string
}

export interface Vehicle {
  id: number
  store_id: number
  customer_id: number
  plate_number: string
  brand?: string
  series?: string
  model?: string
  year?: number
  color?: string
  mileage?: number
  remark?: string
  created_at: string
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
