import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Modal, Space, Table, message } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { Customer, PageResult } from '@/types/api'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async (nextPage = page, nextKeyword = keyword) => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/customers', {
        params: { page: nextPage, page_size: 20, keyword: nextKeyword || undefined },
      })
      const result = unwrap<PageResult<Customer>>(response)
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

  const columns: ColumnsType<Customer> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/customers/${record.id}`)}>
          {name}
        </Button>
      ),
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '到店次数', dataIndex: 'visit_count', key: 'visit_count' },
    { title: '累计消费', dataIndex: 'total_spent', key: 'total_spent', render: (v) => `¥${v}` },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/customers/${record.id}`)}>
          详情
        </Button>
      ),
    },
  ]

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await api.post('/api/v1/customers', values)
      message.success('创建成功')
      setOpen(false)
      form.resetFields()
      fetchData(1)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建失败')
    }
  }

  return (
    <Card
      title="客户管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          新增客户
        </Button>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索姓名/手机号/车牌"
          allowClear
          onSearch={(value) => {
            setKeyword(value)
            fetchData(1, value)
          }}
          style={{ width: 260 }}
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
          onChange: (p) => fetchData(p, keyword),
        }}
      />

      <Modal title="新增客户" open={open} onOk={handleCreate} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
