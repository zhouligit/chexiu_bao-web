import { CrownOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Modal, Row, Space, Table, Tag, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { api, unwrap } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { SubscriptionOrder, SubscriptionPlan } from '@/types/subscription'

export default function SubscriptionSettings() {
  const navigate = useNavigate()
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const subscription = useAuthStore((s) => s.user?.subscription)
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [orders, setOrders] = useState<SubscriptionOrder[]>([])
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<string>('yearly')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plansRes, ordersRes, statusRes] = await Promise.all([
        api.get('/api/v1/subscription/plans'),
        api.get('/api/v1/subscription/orders'),
        api.get('/api/v1/subscription/status'),
      ])
      setPlans(unwrap<SubscriptionPlan[]>(plansRes))
      setOrders(unwrap<SubscriptionOrder[]>(ordersRes))
      await fetchMe()
      void statusRes
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openPurchase = (plan: SubscriptionPlan, cycle: string) => {
    setSelectedPlan(plan)
    setSelectedCycle(cycle)
    setConfirmOpen(true)
  }

  const createOrder = async () => {
    if (!selectedPlan) return
    setCreating(true)
    try {
      const res = await api.post('/api/v1/subscription/orders', {
        plan_code: selectedPlan.code,
        billing_cycle: selectedCycle,
      })
      const order = unwrap<SubscriptionOrder>(res)
      message.success(`订单已创建：${order.order_no}`)
      setConfirmOpen(false)
      fetchData()
      Modal.info({
        title: '请完成支付',
        content: (
          <div>
            <p>订单号：<strong>{order.order_no}</strong></p>
            <p>应付金额：<strong>¥{order.amount}</strong></p>
            <p>请通过微信/支付宝转账并备注订单号，或联系客服开通。</p>
            <p>转账完成后，老板可在下方订单列表点击「我已付款」提交确认。</p>
          </div>
        ),
      })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建订单失败')
    } finally {
      setCreating(false)
    }
  }

  const markPaid = async (orderId: number) => {
    Modal.confirm({
      title: '确认已付款？',
      content: '请确保已完成转账并备注订单号。平台核实后将开通订阅。',
      onOk: async () => {
        await api.post(`/api/v1/subscription/orders/${orderId}/activate`, {
          payment_method: 'manual',
          remark: '门店自助确认',
        })
        message.success('订阅已开通')
        fetchData()
      },
    })
  }

  const orderColumns: ColumnsType<SubscriptionOrder> = [
    { title: '订单号', dataIndex: 'order_no' },
    { title: '套餐', dataIndex: 'plan_name' },
    { title: '周期', dataIndex: 'billing_cycle_label' },
    { title: '金额', dataIndex: 'amount', render: (v) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const map: Record<string, { color: string; label: string }> = {
          pending: { color: 'warning', label: '待支付' },
          paid: { color: 'success', label: '已支付' },
          cancelled: { color: 'default', label: '已取消' },
        }
        const item = map[s] || { color: 'default', label: s }
        return <Tag color={item.color}>{item.label}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button type="link" onClick={() => markPaid(record.id)}>我已付款</Button>
            <Button
              type="link"
              danger
              onClick={async () => {
                await api.post(`/api/v1/subscription/orders/${record.id}/cancel`)
                message.success('订单已取消')
                fetchData()
              }}
            >
              取消
            </Button>
          </Space>
        ) : null,
    },
  ]

  const selectedPrice = selectedPlan?.prices.find((p) => p.billing_cycle === selectedCycle)

  return (
    <div>
      {subscription && (
        <Alert
          type={subscription.can_write ? (subscription.is_active ? 'info' : 'warning') : 'error'}
          showIcon
          message={`当前：${subscription.plan_name}（${subscription.status_label}）`}
          description={subscription.message}
          action={
            !subscription.can_write ? (
              <Button size="small" type="primary" onClick={() => navigate('/settings')}>
                立即续费
              </Button>
            ) : undefined
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {plans.map((plan) => (
          <Col span={12} key={plan.code}>
            <Card
              loading={loading}
              title={
                <Space>
                  <CrownOutlined />
                  {plan.name}
                  {subscription?.plan === plan.code && <Tag color="blue">当前套餐</Tag>}
                </Space>
              }
            >
              <Typography.Paragraph type="secondary">{plan.description}</Typography.Paragraph>
              <ul style={{ paddingLeft: 18, minHeight: 120 }}>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Space direction="vertical" style={{ width: '100%' }}>
                {plan.prices.map((price) => (
                  <Button
                    key={price.billing_cycle}
                    block
                    type={price.billing_cycle === 'yearly' ? 'primary' : 'default'}
                    onClick={() => openPurchase(plan, price.billing_cycle)}
                  >
                    {price.label} ¥{price.amount}
                    {price.unit_price_hint ? `（${price.unit_price_hint}）` : ''}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="订阅订单记录">
        <Table rowKey="id" loading={loading} columns={orderColumns} dataSource={orders} pagination={false} />
      </Card>

      <Modal
        title="确认订阅"
        open={confirmOpen}
        onOk={createOrder}
        confirmLoading={creating}
        onCancel={() => setConfirmOpen(false)}
      >
        {selectedPlan && selectedPrice && (
          <div>
            <p>套餐：{selectedPlan.name}</p>
            <p>计费：{selectedPrice.label}</p>
            <p>金额：<strong>¥{selectedPrice.amount}</strong></p>
            <p style={{ color: '#999' }}>创建订单后请按提示完成支付。</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
