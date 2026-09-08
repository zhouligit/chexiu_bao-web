export interface PartWithStock {
  id: number
  name: string
  code?: string
  brand?: string
  spec?: string
  unit: string
  purchase_price?: number
  sell_price?: number
  safe_stock: number
  quantity: number
  locked_quantity: number
  available_quantity: number
  avg_cost?: number
  is_low_stock: boolean
}

export interface InventoryLog {
  id: number
  part_id: number
  part_name?: string
  type: string
  quantity: number
  before_qty: number
  after_qty: number
  ref_type?: string
  ref_id?: number
  remark?: string
  created_at: string
}

export const LOG_TYPE_LABELS: Record<string, string> = {
  in: '入库',
  out: '出库',
  lock: '锁定',
  unlock: '释放',
}
