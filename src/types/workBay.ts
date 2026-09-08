export interface WorkBay {
  id: number
  store_id: number
  name: string
  type?: string
  status: number
  sort_order: number
  created_at: string
  updated_at: string
}

export const WORK_BAY_TYPE_OPTIONS = [
  { value: 'repair', label: '机修' },
  { value: 'wash', label: '洗车' },
  { value: 'beauty', label: '美容' },
]

export const WORK_BAY_STATUS_OPTIONS = [
  { value: 1, label: '空闲' },
  { value: 2, label: '占用' },
  { value: 0, label: '停用' },
]

export const WORK_BAY_STATUS_LABELS: Record<number, string> = {
  0: '停用',
  1: '空闲',
  2: '占用',
}
