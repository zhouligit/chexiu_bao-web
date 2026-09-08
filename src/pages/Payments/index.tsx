import { Button, Card, Form, Input, InputNumber, Modal, Space, Table, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { PageResult } from '@/types/api'

interface PaymentItem {
  id: number
  payment_no: string
  work_order_id: number
  order_no?: string
  customer_name?: string
  plate_number?: string
  payable_amount: number
  paid_amount: number
  refunded_amount: number
  status: string
  settled_at?: string
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  paid: { label: '已收款', color: 'success' },
  partial_refund: { label: '部分退款', color: 'warning' },
  refunded: { label: '已退款', color: 'default' },
}

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaymentItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [refundOpen, setRefundOpen] = useState(false)
  const [current, setCurrent] = useState<PaymentItem | null>(null)
  const [form] = Form.useForm()

  const fetchData = async (nextPage = page) => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/payments', { params: { page: nextPage, page_size: 20 } })
      const result = unwrap<PageResult<PaymentItem>>(res)
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

  const openRefund = (item: PaymentItem) => {
    setCurrent(item)
    const refundable = item.paid_amount - item.refunded_amount
    form.setFieldsValue({ amount: refundable })
    setRefundOpen(true)
  }

  const submitRefund = async () => {
    if (!current) return
    const values = await form.validateFields()
    try {
      await api.post(`/api/v1/payments/${current.id}/refund`, values)
      message.success('退款成功')
      setRefundOpen(false)
      fetchData(page)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '退款失败')
    }
  }

  const columns: ColumnsType<PaymentItem> = [
    { title: '收款单号', dataIndex: 'payment_no' },
    { title: '工单号', dataIndex: 'order_no' },
    { title: '客户', dataIndex: 'customer_name' },
    { title: '车牌', dataIndex: 'plate_number' },
    { title: '应付', dataIndex: 'payable_amount', render: (v) => `¥${v}` },
    { title: '实付', dataIndex: 'paid_amount', render: (v) => `¥${v}` },
    { title: '已退', dataIndex: 'refunded_amount', render: (v) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const info = STATUS_MAP[s] || { label: s, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    { title: '结算时间', dataIndex: 'settled_at', render: (v) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/work-orders/${record.work_order_id}`)}>
            工单
          </Button>
          {record.status !== 'refunded' && (
            <Button type="link" size="small" danger onClick={() => openRefund(record)}>
              退款
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card title="收退款记录">
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => fetchData(p) }}
      />

      <Modal title="退款" open={refundOpen} onOk={submitRefund} onCancel={() => setRefundOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item label="可退金额">
            <Input
              disabled
              value={current ? `¥${(current.paid_amount - current.refunded_amount).toFixed(2)}` : ''}
            />
          </Form.Item>
          <Form.Item name="amount" label="退款金额" rules={[{ required: true, message: '请输入退款金额' }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="退款原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
