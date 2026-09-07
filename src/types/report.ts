export interface DailyReport {
  date: string
  revenue: number
  order_count: number
  avg_ticket: number
  new_orders: number
  in_progress: number
  pending_settle: number
  completed_today: number
}

export interface OverviewReport {
  today: DailyReport
  month_revenue: number
  month_order_count: number
  total_customers: number
  low_stock_count: number
}

export interface RevenueTrendItem {
  date: string
  revenue: number
  order_count: number
}

export interface ServiceAnalysisItem {
  name: string
  amount: number
  count: number
  ratio: number
}
