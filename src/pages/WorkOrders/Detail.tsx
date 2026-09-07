import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Timeline,
  message,
} from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, unwrap } from '@/services/api'
import type { PartWithStock } from '@/types/inventory'
import type { ServiceItem, WorkOrderDetail } from '@/types/workOrder'
import { WO_STATUS_MAP, WO_STEPS } from '@/types/workOrder'

const NEXT_ACTIONS: Record<string, { to: string; label: string }[]> = {
  pending_inspection: [{ to: 'pending_quote', label: '完成预检' }],
  pending_quote: [{ to: 'pending_confirm', label: '提交报价' }],
  pending_confirm: [{ to: 'in_progress', label: '客户确认' }],
  in_progress: [{ to: 'pending_qc', label: '施工完成' }],
  pending_qc: [
    { to: 'pending_settle', label: '质检通过' },
    { to: 'in_progress', label: '质检驳回' },
  ],
}

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<WorkOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [stockParts, setStockParts] = useState<PartWithStock[]>([])
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [partModalOpen, setPartModalOpen] = useState(false)
  const [settleModalOpen, setSettleModalOpen] = useState(false)
  const [itemForm] = Form.useForm()
  const [partForm] = Form.useForm()
  const [settleForm] = Form.useForm()

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/work-orders/${id}`)
      setOrder(unwrap<WorkOrderDetail>(res))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
    api.get('/api/v1/service-items').then((res) => {
      setServiceItems(unwrap<ServiceItem[]>(res))
    })
    api.get('/api/v1/parts').then((res) => {
      setStockParts(unwrap<PartWithStock[]>(res))
    })
  }, [id])

  const transition = async (toStatus: string) => {
    try {
      await api.put(`/api/v1/work-orders/${id}/status`, { to_status: toStatus })
      message.success('操作成功')
      fetchDetail()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const addItem = async () => {
    const values = await itemForm.validateFields()
    const service = serviceItems.find((s) => s.id === values.service_item_id)
    await api.post(`/api/v1/work-orders/${id}/items`, {
      service_item_id: values.service_item_id,
      name: service?.name || values.name,
      quantity: values.quantity,
      unit_price: values.unit_price,
      discount: values.discount ?? 100,
    })
    message.success('已添加项目')
    setItemModalOpen(false)
    itemForm.resetFields()
    fetchDetail()
  }

  const addPart = async () => {
    const values = await partForm.validateFields()
    try {
      const payload: Record<string, unknown> = {
        part_id: values.part_id,
        quantity: values.quantity,
      }
      if (values.part_id) {
        const part = stockParts.find((p) => p.id === values.part_id)
        if (part && values.quantity > part.available_quantity) {
          message.error(`库存不足，可用 ${part.available_quantity}`)
          return
        }
      } else {
        payload.name = values.name
        payload.unit_price = values.unit_price
      }
      await api.post(`/api/v1/work-orders/${id}/parts`, payload)
      message.success('已添加配件')
      setPartModalOpen(false)
      partForm.resetFields()
      fetchDetail()
      api.get('/api/v1/parts').then((res) => setStockParts(unwrap<PartWithStock[]>(res)))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '添加失败')
    }
  }

  const onPartSelect = (partId: number) => {
    const part = stockParts.find((p) => p.id === partId)
    if (part) {
      partForm.setFieldsValue({ name: part.name, unit_price: part.sell_price })
    }
  }

  const settle = async () => {
    const values = await settleForm.validateFields()
    const discount = values.discount_amount || 0
    const payable = Number((order!.total_amount - discount).toFixed(2))
    try {
      await api.post(`/api/v1/work-orders/${id}/settle`, {
        discount_amount: discount,
        payments: [{ method: values.method, amount: payable }],
      })
      message.success('结算成功')
      setSettleModalOpen(false)
      fetchDetail()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '结算失败')
    }
  }

  const onServiceSelect = (serviceId: number) => {
    const service = serviceItems.find((s) => s.id === serviceId)
    if (service) {
      itemForm.setFieldsValue({ unit_price: service.price, name: service.name })
    }
  }

  if (!order) {
    return <Card loading={loading}>加载中...</Card>
  }

  const currentStep = WO_STEPS.indexOf(order.status)
  const canEditItems = ['pending_quote', 'pending_confirm', 'in_progress'].includes(order.status)
  const actions = NEXT_ACTIONS[order.status] || []

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-orders')}>
          返回列表
        </Button>
        <Tag color={WO_STATUS_MAP[order.status]?.color}>{order.status_label}</Tag>
      </Space>

      <Card title={`工单 ${order.order_no}`} loading={loading} style={{ marginBottom: 16 }}>
        <Steps
          current={currentStep >= 0 ? currentStep : 0}
          size="small"
          items={WO_STEPS.map((s) => ({ title: WO_STATUS_MAP[s]?.label || s }))}
          style={{ marginBottom: 24 }}
        />

        <Descriptions column={3} bordered size="small">
          <Descriptions.Item label="客户">{order.customer?.name} ({order.customer?.phone})</Descriptions.Item>
          <Descriptions.Item label="车牌">{order.vehicle?.plate_number}</Descriptions.Item>
          <Descriptions.Item label="车型">{order.vehicle?.brand} {order.vehicle?.model}</Descriptions.Item>
          <Descriptions.Item label="进店里程">{order.mileage_in ? `${order.mileage_in} km` : '-'}</Descriptions.Item>
          <Descriptions.Item label="油量">{order.fuel_level || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{order.created_at}</Descriptions.Item>
          <Descriptions.Item label="客户诉求" span={3}>{order.customer_request || '-'}</Descriptions.Item>
        </Descriptions>

        <Space style={{ marginTop: 16 }} wrap>
          {actions.map((a) => (
            <Button key={a.to} type="primary" onClick={() => transition(a.to)}>
              {a.label}
            </Button>
          ))}
          {order.status === 'pending_settle' && (
            <Button type="primary" onClick={() => {
              settleForm.setFieldsValue({ discount_amount: 0, method: 'cash' })
              setSettleModalOpen(true)
            }}>
              收银结算
            </Button>
          )}
          {!['completed', 'cancelled'].includes(order.status) && (
            <Button danger onClick={() => transition('cancelled')}>取消工单</Button>
          )}
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={16}>
          <Card
            title="服务项目"
            extra={
              canEditItems && (
                <Button size="small" icon={<PlusOutlined />} onClick={() => setItemModalOpen(true)}>
                  添加项目
                </Button>
              )
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              rowKey="id"
              pagination={false}
              dataSource={order.items}
              columns={[
                { title: '项目', dataIndex: 'name' },
                { title: '数量', dataIndex: 'quantity' },
                { title: '单价', dataIndex: 'unit_price', render: (v) => `¥${v}` },
                { title: '折扣', dataIndex: 'discount', render: (v) => `${v}%` },
                { title: '小计', dataIndex: 'amount', render: (v) => `¥${v}` },
              ]}
            />
          </Card>

          <Card
            title="配件"
            extra={
              canEditItems && (
                <Button size="small" icon={<PlusOutlined />} onClick={() => setPartModalOpen(true)}>
                  添加配件
                </Button>
              )
            }
          >
            <Table
              rowKey="id"
              pagination={false}
              dataSource={order.parts}
              columns={[
                { title: '配件', dataIndex: 'name' },
                { title: '数量', dataIndex: 'quantity' },
                { title: '单价', dataIndex: 'unit_price', render: (v) => `¥${v}` },
                { title: '小计', dataIndex: 'amount', render: (v) => `¥${v}` },
                {
                  title: '库存状态',
                  dataIndex: 'status',
                  render: (s: string) => {
                    const map: Record<string, string> = { pending: '已锁定', picked: '已出库', returned: '已退料' }
                    return map[s] || s || '-'
                  },
                },
              ]}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="费用汇总" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="合计">¥{order.total_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="折扣">¥{order.discount_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="应付">
                <span style={{ fontSize: 18, color: '#1677ff', fontWeight: 600 }}>
                  ¥{order.payable_amount.toFixed(2)}
                </span>
              </Descriptions.Item>
              {order.status === 'completed' && (
                <Descriptions.Item label="实付">¥{order.paid_amount.toFixed(2)}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="操作记录">
            <Timeline
              items={order.logs.map((log) => ({
                children: (
                  <div>
                    <div>{WO_STATUS_MAP[log.to_status]?.label || log.to_status}</div>
                    {log.remark && <div style={{ color: '#999', fontSize: 12 }}>{log.remark}</div>}
                    <div style={{ color: '#999', fontSize: 12 }}>{log.created_at}</div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="添加服务项目" open={itemModalOpen} onOk={addItem} onCancel={() => setItemModalOpen(false)} destroyOnClose>
        <Form form={itemForm} layout="vertical" initialValues={{ quantity: 1, discount: 100 }}>
          <Form.Item name="service_item_id" label="从项目库选择">
            <Select
              allowClear
              placeholder="选择服务项目"
              options={serviceItems.map((s) => ({ value: s.id, label: `${s.name} (¥${s.price})` }))}
              onChange={onServiceSelect}
            />
          </Form.Item>
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit_price" label="单价" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="discount" label="折扣(%)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加配件" open={partModalOpen} onOk={addPart} onCancel={() => setPartModalOpen(false)} destroyOnClose>
        <Form form={partForm} layout="vertical" initialValues={{ quantity: 1 }}>
          <Form.Item name="part_id" label="从库存选择">
            <Select
              allowClear
              placeholder="选择配件（自动锁定库存）"
              options={stockParts.map((p) => ({
                value: p.id,
                label: `${p.name} (可用: ${p.available_quantity}${p.unit}) ¥${p.sell_price ?? 0}`,
                disabled: p.available_quantity <= 0,
              }))}
              onChange={onPartSelect}
            />
          </Form.Item>
          <Form.Item name="name" label="配件名称（手动添加时填写）">
            <Input placeholder="从库存选择可留空" />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit_price" label="单价（手动添加时填写）">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="收银结算" open={settleModalOpen} onOk={settle} onCancel={() => setSettleModalOpen(false)} destroyOnClose>
        <Form form={settleForm} layout="vertical">
          <Form.Item label="应付金额">
            <Input value={`¥${order.payable_amount.toFixed(2)}`} disabled />
          </Form.Item>
          <Form.Item name="discount_amount" label="整单折扣(元)">
            <InputNumber min={0} max={order.payable_amount} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label="支付方式" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'cash', label: '现金' },
                { value: 'wechat', label: '微信' },
                { value: 'alipay', label: '支付宝' },
                { value: 'bank', label: '银行卡' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
