import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Input, Select, Space, Table, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { PageResult } from '@/types/api'
import type { WorkOrderListItem } from '@/types/workOrder'
import { WO_STATUS_MAP } from '@/types/workOrder'

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  ...Object.entries(WO_STATUS_MAP).map(([value, { label }]) => ({ value, label })),
]

export default function WorkOrderListPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WorkOrderListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  const fetchData = async (nextPage = page, nextKeyword = keyword, nextStatus = status) => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/work-orders', {
        params: {
          page: nextPage,
          page_size: 20,
          keyword: nextKeyword || undefined,
          status: nextStatus || undefined,
        },
      })
      const result = unwrap<PageResult<WorkOrderListItem>>(response)
      setData(result.items)
      setTotal(result.total)
      setPage(result.page)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [])

  const columns: ColumnsType<WorkOrderListItem> = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const info = WO_STATUS_MAP[s] || { label: s, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '车牌', dataIndex: 'plate_number', key: 'plate_number' },
    {
      title: '应付金额',
      dataIndex: 'payable_amount',
      key: 'payable_amount',
      render: (v: number) => `¥${v.toFixed(2)}`,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/work-orders/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ]

  return (
    <Card
      title="工单管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/work-orders/create')}>
          接车开单
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索工单号"
          allowClear
          onSearch={(value) => {
            setKeyword(value)
            fetchData(1, value, status)
          }}
          style={{ width: 220 }}
        />
        <Select
          value={status}
          options={STATUS_OPTIONS}
          style={{ width: 140 }}
          onChange={(value) => {
            setStatus(value)
            fetchData(1, keyword, value)
          }}
        />
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => fetchData(p, keyword, status),
        }}
      />
    </Card>
  )
}
