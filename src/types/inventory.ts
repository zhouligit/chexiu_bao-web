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
