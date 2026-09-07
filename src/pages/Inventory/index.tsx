import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Space, Table, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { PartWithStock } from '@/types/inventory'

export default function InventoryPage() {
  const [loading, setLoading] = useState(false)
  const [parts, setParts] = useState<PartWithStock[]>([])
  const [alerts, setAlerts] = useState<PartWithStock[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [stockInOpen, setStockInOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<PartWithStock | null>(null)
  const [createForm] = Form.useForm()
  const [stockInForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [partsRes, alertsRes] = await Promise.all([
        api.get('/api/v1/parts'),
        api.get('/api/v1/inventory/alerts'),
      ])
      setParts(unwrap<PartWithStock[]>(partsRes))
      setAlerts(unwrap<PartWithStock[]>(alertsRes))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    try {
      await api.post('/api/v1/parts', values)
      message.success('配件创建成功')
      setCreateOpen(false)
      createForm.resetFields()
      fetchData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建失败')
    }
  }

  const handleStockIn = async () => {
    const values = await stockInForm.validateFields()
    try {
      await api.post('/api/v1/inventory/in', {
        part_id: selectedPart!.id,
        ...values,
      })
      message.success('入库成功')
      setStockInOpen(false)
      stockInForm.resetFields()
      fetchData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '入库失败')
    }
  }

  const columns: ColumnsType<PartWithStock> = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '品牌', dataIndex: 'brand', key: 'brand', render: (v) => v || '-' },
    { title: '售价', dataIndex: 'sell_price', key: 'sell_price', render: (v) => (v != null ? `¥${v}` : '-') },
    { title: '库存', dataIndex: 'quantity', key: 'quantity' },
    { title: '锁定', dataIndex: 'locked_quantity', key: 'locked_quantity' },
    {
      title: '可用',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      render: (v, record) => (
        <Space>
          <span>{v}</span>
          {record.is_low_stock && <Tag color="warning">低库存</Tag>}
        </Space>
      ),
    },
    { title: '安全库存', dataIndex: 'safe_stock', key: 'safe_stock' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedPart(record)
            stockInForm.setFieldsValue({ unit_cost: record.purchase_price })
            setStockInOpen(true)
          }}
        >
          入库
        </Button>
      ),
    },
  ]

  return (
    <div>
      {alerts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`${alerts.length} 种配件库存低于安全线`}
          description={alerts.map((a) => a.name).join('、')}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title="配件库存"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新增配件
          </Button>
        }
      >
        <Table rowKey="id" loading={loading} columns={columns} dataSource={parts} pagination={false} />
      </Card>

      <Modal title="新增配件" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)} destroyOnClose>
        <Form form={createForm} layout="vertical" initialValues={{ unit: '个', safe_stock: 0, initial_stock: 0 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="编码">
            <Input />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input />
          </Form.Item>
          <Form.Item name="purchase_price" label="采购价">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sell_price" label="销售价">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="safe_stock" label="安全库存">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="initial_stock" label="初始库存">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`入库 - ${selectedPart?.name}`}
        open={stockInOpen}
        onOk={handleStockIn}
        onCancel={() => setStockInOpen(false)}
        destroyOnClose
      >
        <Form form={stockInForm} layout="vertical">
          <Form.Item name="quantity" label="入库数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit_cost" label="单位成本">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
