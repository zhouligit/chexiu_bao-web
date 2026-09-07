import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Select, Space, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, unwrap } from '@/services/api'
import type { Customer, PageResult, Vehicle } from '@/types/api'

export default function WorkOrderCreatePage() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customerId, setCustomerId] = useState<number | null>(null)

  useEffect(() => {
    api.get('/api/v1/customers', { params: { page: 1, page_size: 100 } }).then((res) => {
      const result = unwrap<PageResult<Customer>>(res)
      setCustomers(result.items)
    })
  }, [])

  const loadVehicles = async (cid: number) => {
    setCustomerId(cid)
    form.setFieldValue('vehicle_id', undefined)
    const res = await api.get(`/api/v1/customers/${cid}/vehicles`)
    setVehicles(unwrap<Vehicle[]>(res))
  }

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await api.post('/api/v1/work-orders', values)
      const detail = unwrap<{ id: number }>(res)
      message.success('接车成功')
      navigate(`/work-orders/${detail.id}`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="接车开单"
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-orders')}>
          返回列表
        </Button>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 560 }}>
        <Form.Item name="customer_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
          <Select
            showSearch
            placeholder="选择客户"
            optionFilterProp="label"
            options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
            onChange={loadVehicles}
          />
        </Form.Item>
        <Form.Item name="vehicle_id" label="车辆" rules={[{ required: true, message: '请选择车辆' }]}>
          <Select
            placeholder={customerId ? '选择车辆' : '请先选择客户'}
            disabled={!customerId}
            options={vehicles.map((v) => ({
              value: v.id,
              label: `${v.plate_number}${v.brand ? ` - ${v.brand}` : ''}`,
            }))}
          />
        </Form.Item>
        <Form.Item name="mileage_in" label="进店里程(km)">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="fuel_level" label="油量">
          <Select
            allowClear
            options={[
              { value: 'empty', label: '空' },
              { value: '1/4', label: '1/4' },
              { value: '1/2', label: '1/2' },
              { value: '3/4', label: '3/4' },
              { value: 'full', label: '满' },
            ]}
          />
        </Form.Item>
        <Form.Item name="customer_request" label="客户诉求">
          <Input.TextArea rows={3} placeholder="描述客户维修需求" />
        </Form.Item>
        <Form.Item name="internal_note" label="内部备注">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            确认接车
          </Button>
          <Button onClick={() => navigate('/work-orders')}>取消</Button>
        </Space>
      </Form>
    </Card>
  )
}
