import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Modal, Select, Space, Switch, Table, Tabs, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { StoreInfo, UserListItem } from '@/types/api'

const ROLE_OPTIONS = [
  { value: 'manager', label: '店长' },
  { value: 'receptionist', label: '前台' },
  { value: 'technician', label: '技师' },
  { value: 'warehouse', label: '仓管' },
  { value: 'finance', label: '财务' },
]

const ROLE_LABELS: Record<string, string> = {
  owner: '老板',
  manager: '店长',
  receptionist: '前台',
  technician: '技师',
  warehouse: '仓管',
  finance: '财务',
}

function StoreSettings() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/api/v1/store')
      .then((res) => {
        const store = unwrap<StoreInfo>(res)
        form.setFieldsValue(store)
      })
      .catch((error) => message.error(error instanceof Error ? error.message : '加载失败'))
      .finally(() => setLoading(false))
  }, [form])

  const onSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      await api.put('/api/v1/store', values)
      message.success('保存成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="门店信息" loading={loading}>
      <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
        <Form.Item name="name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="门店电话">
          <Input />
        </Form.Item>
        <Form.Item name="address" label="门店地址">
          <Input />
        </Form.Item>
        <Form.Item name="logo_url" label="Logo URL">
          <Input placeholder="https://..." />
        </Form.Item>
        <Button type="primary" onClick={onSave} loading={saving}>
          保存
        </Button>
      </Form>
    </Card>
  )
}

function UserSettings() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserListItem[]>([])
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/users')
      setUsers(unwrap<UserListItem[]>(res))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = async () => {
    const values = await form.validateFields()
    try {
      await api.post('/api/v1/users', values)
      message.success('员工已添加')
      setOpen(false)
      form.resetFields()
      fetchUsers()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '添加失败')
    }
  }

  const toggleStatus = async (user: UserListItem) => {
    try {
      await api.put(`/api/v1/users/${user.id}`, { status: user.status === 1 ? 0 : 1 })
      message.success('已更新')
      fetchUsers()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  const columns: ColumnsType<UserListItem> = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'name' },
    { title: '手机', dataIndex: 'phone', render: (v) => v || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: string) => <Tag>{ROLE_LABELS[role] || role}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch
          checked={status === 1}
          disabled={record.role === 'owner'}
          onChange={() => toggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    { title: '最后登录', dataIndex: 'last_login_at', render: (v) => v || '-' },
  ]

  return (
    <Card
      title="员工管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          新增员工
        </Button>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={users} pagination={false} />

      <Modal title="新增员工" open={open} onOk={handleCreate} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ role: 'receptionist' }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default function SettingsPage() {
  return (
    <Tabs
      items={[
        { key: 'store', label: '门店信息', children: <StoreSettings /> },
        { key: 'users', label: '员工管理', children: <UserSettings /> },
      ]}
    />
  )
}
