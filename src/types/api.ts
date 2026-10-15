import type { SubscriptionInfo } from '@/types/subscription'

export type { SubscriptionInfo } from '@/types/subscription'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface RoleBrief {
  id?: number
  slug: string
  name: string
}

export interface UserInfo {
  id: number
  store_id: number
  username: string
  name: string
  phone?: string
  role: string
  role_info?: RoleBrief
  permissions?: string[]
  data_policy?: Record<string, unknown>
  avatar_url?: string
  store?: {
    id: number
    name: string
    code?: string
  }
  subscription?: SubscriptionInfo
}

export interface LoginResult {
  access_token: string
  refresh_token: string
  token_type: string
  user: UserInfo
}

export interface StoreInfo {
  id: number
  name: string
  code?: string
  phone?: string
  address?: string
  logo_url?: string
  status: number
  plan: string
  created_at: string
}

export interface StoreRoleListItem {
  id: number
  store_id: number
  slug: string
  name: string
  is_system: boolean
  user_count: number
  permission_count: number
}

export interface PermissionCatalogItem {
  id: number
  code: string
  module: string
  name: string
  sort: number
  is_sensitive: boolean
}

export interface StoreRoleDetail {
  id: number
  store_id: number
  slug: string
  name: string
  is_system: boolean
  data_policy: Record<string, unknown>
  permission_codes: string[]
}

export interface UserListItem {
  id: number
  store_id: number
  username: string
  name: string
  phone?: string
  role: string
  role_id?: number
  role_name?: string
  status: number
  last_login_at?: string
  created_at: string
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
