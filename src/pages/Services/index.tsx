import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { ServiceItem } from '@/types/workOrder'

export default function ServicesPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ServiceItem[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceItem | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/service-items', { params: { all: true } })
      setData(unwrap<ServiceItem[]>(res))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openModal = (item?: ServiceItem) => {
    setEditing(item || null)
    form.resetFields()
    if (item) {
      form.setFieldsValue(item)
    } else {
      form.setFieldsValue({ unit: '次', status: 1 })
    }
    setOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await api.put(`/api/v1/service-items/${editing.id}`, values)
        message.success('已更新')
      } else {
        await api.post('/api/v1/service-items', values)
        message.success('已创建')
      }
      setOpen(false)
      fetchData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  const handleDelete = async (item: ServiceItem) => {
    Modal.confirm({
      title: '确认删除该服务项目？',
      onOk: async () => {
        await api.delete(`/api/v1/service-items/${item.id}`)
        message.success('已删除')
        fetchData()
      },
    })
  }

  const columns: ColumnsType<ServiceItem> = [
    { title: '项目名称', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code', render: (v) => v || '-' },
    { title: '单价', dataIndex: 'price', render: (v) => `¥${v}` },
    { title: '工时', dataIndex: 'labor_hours', render: (v) => v ?? '-' },
    { title: '单位', dataIndex: 'unit' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number) => (status === 1 ? '启用' : '停用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openModal(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="服务项目"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增项目
        </Button>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={false} />

      <Modal
        title={editing ? '编辑服务项目' : '新增服务项目'}
        open={open}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="编码">
            <Input />
          </Form.Item>
          <Form.Item name="price" label="单价(元)" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="labor_hours" label="标准工时">
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="单位">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          {editing && (
            <Form.Item name="status" label="状态">
              <Select
                options={[
                  { value: 1, label: '启用' },
                  { value: 0, label: '停用' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
