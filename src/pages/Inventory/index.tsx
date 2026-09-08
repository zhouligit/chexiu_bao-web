import { EditOutlined, MinusOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { InventoryLog, PartWithStock } from '@/types/inventory'
import { LOG_TYPE_LABELS } from '@/types/inventory'

export default function InventoryPage() {
  const [loading, setLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [parts, setParts] = useState<PartWithStock[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [alerts, setAlerts] = useState<PartWithStock[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [stockInOpen, setStockInOpen] = useState(false)
  const [stockOutOpen, setStockOutOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<PartWithStock | null>(null)
  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [stockInForm] = Form.useForm()
  const [stockOutForm] = Form.useForm()

  const fetchParts = async () => {
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

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await api.get('/api/v1/inventory/logs', { params: { limit: 200 } })
      setLogs(unwrap<InventoryLog[]>(res))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载流水失败')
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchParts()
    fetchLogs()
  }, [])

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    try {
      await api.post('/api/v1/parts', values)
      message.success('配件创建成功')
      setCreateOpen(false)
      createForm.resetFields()
      fetchParts()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建失败')
    }
  }

  const handleEdit = async () => {
    const values = await editForm.validateFields()
    try {
      await api.put(`/api/v1/parts/${selectedPart!.id}`, values)
      message.success('配件已更新')
      setEditOpen(false)
      editForm.resetFields()
      fetchParts()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新失败')
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
      fetchParts()
      fetchLogs()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '入库失败')
    }
  }

  const handleStockOut = async () => {
    const values = await stockOutForm.validateFields()
    try {
      await api.post('/api/v1/inventory/out', {
        part_id: selectedPart!.id,
        ...values,
      })
      message.success('出库成功')
      setStockOutOpen(false)
      stockOutForm.resetFields()
      fetchParts()
      fetchLogs()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '出库失败')
    }
  }

  const openEdit = (record: PartWithStock) => {
    setSelectedPart(record)
    editForm.setFieldsValue({
      name: record.name,
      code: record.code,
      brand: record.brand,
      spec: record.spec,
      unit: record.unit,
      purchase_price: record.purchase_price,
      sell_price: record.sell_price,
      safe_stock: record.safe_stock,
    })
    setEditOpen(true)
  }

  const partColumns: ColumnsType<PartWithStock> = [
    { title: '编码', dataIndex: 'code', key: 'code', render: (v) => v || '-' },
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
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
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
          <Button
            type="link"
            danger
            icon={<MinusOutlined />}
            disabled={record.available_quantity <= 0}
            onClick={() => {
              setSelectedPart(record)
              stockOutForm.resetFields()
              setStockOutOpen(true)
            }}
          >
            出库
          </Button>
        </Space>
      ),
    },
  ]

  const logColumns: ColumnsType<InventoryLog> = [
    { title: '时间', dataIndex: 'created_at', width: 180 },
    { title: '配件', dataIndex: 'part_name', render: (v) => v || '-' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v: string) => LOG_TYPE_LABELS[v] || v,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      render: (v: number) => (v > 0 ? `+${v}` : v),
    },
    { title: '变更前', dataIndex: 'before_qty' },
    { title: '变更后', dataIndex: 'after_qty' },
    { title: '备注', dataIndex: 'remark', render: (v) => v || '-' },
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

      <Card>
        <Tabs
          items={[
            {
              key: 'parts',
              label: '配件库存',
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                      新增配件
                    </Button>
                  </div>
                  <Table rowKey="id" loading={loading} columns={partColumns} dataSource={parts} pagination={false} />
                </>
              ),
            },
            {
              key: 'logs',
              label: '库存流水',
              children: (
                <Table
                  rowKey="id"
                  loading={logsLoading}
                  columns={logColumns}
                  dataSource={logs}
                  pagination={{ pageSize: 20 }}
                />
              ),
            },
          ]}
        />
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

      <Modal title={`编辑 - ${selectedPart?.name}`} open={editOpen} onOk={handleEdit} onCancel={() => setEditOpen(false)} destroyOnClose>
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="编码">
            <Input />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input />
          </Form.Item>
          <Form.Item name="spec" label="规格">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位">
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

      <Modal
        title={`出库 - ${selectedPart?.name}`}
        open={stockOutOpen}
        onOk={handleStockOut}
        onCancel={() => setStockOutOpen(false)}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message={`当前可用库存：${selectedPart?.available_quantity ?? 0} ${selectedPart?.unit || ''}`}
          style={{ marginBottom: 16 }}
        />
        <Form form={stockOutForm} layout="vertical">
          <Form.Item name="quantity" label="出库数量" rules={[{ required: true }]}>
            <InputNumber min={1} max={selectedPart?.available_quantity} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="如：损耗、调拨等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
