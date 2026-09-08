import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Form, Input, InputNumber, Modal, Space, Table, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { Customer, Vehicle } from '@/types/api'
import type { WorkOrderListItem } from '@/types/workOrder'
import { WO_STATUS_MAP } from '@/types/workOrder'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [orders, setOrders] = useState<WorkOrderListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [vehicleOpen, setVehicleOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [vehicleForm] = Form.useForm()
  const [editForm] = Form.useForm()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [customerRes, vehiclesRes, ordersRes] = await Promise.all([
        api.get(`/api/v1/customers/${id}`),
        api.get(`/api/v1/customers/${id}/vehicles`),
        api.get(`/api/v1/customers/${id}/work-orders`),
      ])
      const c = unwrap<Customer>(customerRes)
      setCustomer(c)
      setVehicles(unwrap<Vehicle[]>(vehiclesRes))
      setOrders(unwrap<WorkOrderListItem[]>(ordersRes))
      editForm.setFieldsValue(c)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [id])

  const addVehicle = async () => {
    const values = await vehicleForm.validateFields()
    try {
      await api.post('/api/v1/customers/vehicles', { ...values, customer_id: Number(id) })
      message.success('车辆已添加')
      setVehicleOpen(false)
      vehicleForm.resetFields()
      fetchAll()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '添加失败')
    }
  }

  const saveCustomer = async () => {
    const values = await editForm.validateFields()
    try {
      await api.put(`/api/v1/customers/${id}`, values)
      message.success('已保存')
      setEditOpen(false)
      fetchAll()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  const deleteVehicle = (vehicle: Vehicle) => {
    Modal.confirm({
      title: `确认删除车辆 ${vehicle.plate_number}？`,
      onOk: async () => {
        await api.delete(`/api/v1/customers/vehicles/${vehicle.id}`)
        message.success('已删除')
        fetchAll()
      },
    })
  }

  const vehicleColumns: ColumnsType<Vehicle> = [
    { title: '车牌', dataIndex: 'plate_number' },
    { title: '品牌', dataIndex: 'brand', render: (v) => v || '-' },
    { title: '车系', dataIndex: 'series', render: (v) => v || '-' },
    { title: '里程(km)', dataIndex: 'mileage', render: (v) => v ?? '-' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" danger onClick={() => deleteVehicle(record)}>
          删除
        </Button>
      ),
    },
  ]

  const orderColumns: ColumnsType<WorkOrderListItem> = [
    { title: '工单号', dataIndex: 'order_no' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string, record) => (
        <Tag color={WO_STATUS_MAP[status]?.color}>{record.status_label}</Tag>
      ),
    },
    { title: '车牌', dataIndex: 'plate_number' },
    { title: '应付', dataIndex: 'payable_amount', render: (v) => `¥${v}` },
    { title: '创建时间', dataIndex: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/work-orders/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ]

  if (!customer) {
    return <Card loading={loading}>加载中...</Card>
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
          返回列表
        </Button>
        <Button onClick={() => setEditOpen(true)}>编辑客户</Button>
      </Space>

      <Card title={`客户：${customer.name}`} loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="手机">{customer.phone}</Descriptions.Item>
          <Descriptions.Item label="到店次数">{customer.visit_count}</Descriptions.Item>
          <Descriptions.Item label="累计消费">¥{customer.total_spent}</Descriptions.Item>
          <Descriptions.Item label="备注" span={3}>{customer.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="车辆"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setVehicleOpen(true)}>
            添加车辆
          </Button>
        }
      >
        <Table rowKey="id" columns={vehicleColumns} dataSource={vehicles} pagination={false} />
      </Card>

      <Card title="消费记录">
        <Table rowKey="id" columns={orderColumns} dataSource={orders} pagination={false} />
      </Card>

      <Modal title="添加车辆" open={vehicleOpen} onOk={addVehicle} onCancel={() => setVehicleOpen(false)} destroyOnClose>
        <Form form={vehicleForm} layout="vertical">
          <Form.Item name="plate_number" label="车牌号" rules={[{ required: true }]}>
            <Input placeholder="京A12345" />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input />
          </Form.Item>
          <Form.Item name="series" label="车系">
            <Input />
          </Form.Item>
          <Form.Item name="model" label="车型">
            <Input />
          </Form.Item>
          <Form.Item name="mileage" label="里程(km)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="编辑客户" open={editOpen} onOk={saveCustomer} onCancel={() => setEditOpen(false)} destroyOnClose>
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
