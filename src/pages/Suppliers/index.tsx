import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Modal, Space, Table, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'

interface Supplier {
  id: number
  name: string
  contact?: string
  phone?: string
  address?: string
  remark?: string
  created_at: string
}

export default function SuppliersPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Supplier[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/suppliers')
      setData(unwrap<Supplier[]>(res))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openModal = (item?: Supplier) => {
    setEditing(item || null)
    form.resetFields()
    if (item) form.setFieldsValue(item)
    setOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await api.put(`/api/v1/suppliers/${editing.id}`, values)
        message.success('已更新')
      } else {
        await api.post('/api/v1/suppliers', values)
        message.success('已创建')
      }
      setOpen(false)
      fetchData()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  const handleDelete = (item: Supplier) => {
    Modal.confirm({
      title: `确认删除供应商 ${item.name}？`,
      onOk: async () => {
        await api.delete(`/api/v1/suppliers/${item.id}`)
        message.success('已删除')
        fetchData()
      },
    })
  }

  const columns: ColumnsType<Supplier> = [
    { title: '名称', dataIndex: 'name' },
    { title: '联系人', dataIndex: 'contact', render: (v) => v || '-' },
    { title: '电话', dataIndex: 'phone', render: (v) => v || '-' },
    { title: '地址', dataIndex: 'address', render: (v) => v || '-' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openModal(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="供应商管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增供应商
        </Button>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={false} />

      <Modal title={editing ? '编辑供应商' : '新增供应商'} open={open} onOk={handleSave} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
