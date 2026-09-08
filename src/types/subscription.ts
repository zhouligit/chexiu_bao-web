export interface SubscriptionInfo {
  status: string
  status_label: string
  plan: string
  plan_name: string
  expired_at?: string
  days_remaining?: number
  is_active: boolean
  can_write: boolean
  message?: string
}

export interface SubscriptionPlan {
  code: string
  name: string
  description: string
  max_users: number
  features: string[]
  prices: Array<{
    billing_cycle: string
    label: string
    amount: number
    unit_price_hint?: string
  }>
}

export interface SubscriptionOrder {
  id: number
  order_no: string
  plan_code: string
  plan_name: string
  billing_cycle: string
  billing_cycle_label: string
  amount: number
  status: string
  payment_method?: string
  period_start?: string
  period_end?: string
  paid_at?: string
  remark?: string
  created_at: string
}

export const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: '月付',
  yearly: '年付',
  lifetime: '终身买断',
}
