export interface WorkOrderListItem {
  id: number
  order_no: string
  status: string
  status_label: string
  customer_id: number
  vehicle_id: number
  customer_name?: string
  plate_number?: string
  total_amount: number
  payable_amount: number
  created_at: string
}

export interface WorkOrderItem {
  id: number
  name: string
  quantity: number
  unit_price: number
  discount: number
  amount: number
  type: string
  status: string
  technician_id?: number
}

export interface WorkOrderPart {
  id: number
  name: string
  quantity: number
  unit_price: number
  amount: number
  status: string
}

export interface WorkOrderLog {
  id: number
  from_status: string | null
  to_status: string
  remark: string | null
  created_at: string
}

export interface WorkOrderDetail {
  id: number
  order_no: string
  status: string
  status_label: string
  customer_id: number
  vehicle_id: number
  customer?: { id: number; name: string; phone: string }
  vehicle?: { id: number; plate_number: string; brand?: string; model?: string }
  mileage_in?: number
  fuel_level?: string
  customer_request?: string
  internal_note?: string
  total_amount: number
  discount_amount: number
  payable_amount: number
  paid_amount: number
  work_bay_id?: number
  work_bay?: { id: number; name: string }
  items: WorkOrderItem[]
  parts: WorkOrderPart[]
  logs: WorkOrderLog[]
  created_at: string
  finished_at?: string
  settled_at?: string
}

export interface ServiceItem {
  id: number
  name: string
  code?: string
  price: number
  unit: string
  labor_hours?: number
  description?: string
  status?: number
}

export const WO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_inspection: { label: '待预检', color: 'default' },
  pending_quote: { label: '待报价', color: 'processing' },
  pending_confirm: { label: '待确认', color: 'warning' },
  in_progress: { label: '施工中', color: 'blue' },
  pending_qc: { label: '待质检', color: 'orange' },
  pending_settle: { label: '待结算', color: 'purple' },
  completed: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'error' },
}

export const WO_STEPS = [
  'pending_inspection',
  'pending_quote',
  'pending_confirm',
  'in_progress',
  'pending_qc',
  'pending_settle',
  'completed',
]

export const ITEM_STATUS_LABELS: Record<string, string> = {
  pending_confirm: '待确认',
  pending: '待施工',
  in_progress: '施工中',
  paused: '已暂停',
  completed: '已完成',
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: '现金' },
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'bank', label: '银行卡' },
  { value: 'card', label: '储值卡' },
]
