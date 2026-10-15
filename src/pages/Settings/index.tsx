import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tabs, Tag, message } from 'antd'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useLocation } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { StoreInfo, UserListItem, UserManagementAccess } from '@/types/api'
import type { WorkBay } from '@/types/workBay'
import { WORK_BAY_STATUS_LABELS, WORK_BAY_STATUS_OPTIONS, WORK_BAY_TYPE_OPTIONS } from '@/types/workBay'
import SubscriptionSettings from '@/pages/Settings/Subscription'
import RoleSettings from '@/pages/Settings/Roles'
import { useAnyPermission, usePermission } from '@/hooks/usePermission'
import type { StoreRoleListItem } from '@/types/api'

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
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const [access, setAccess] = useState<UserManagementAccess | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserListItem[]>([])
  const [roles, setRoles] = useState<StoreRoleListItem[]>([])
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
    fetchMe().catch(() => {})
    api
      .get('/api/v1/users/access')
      .then((res) => setAccess(unwrap<UserManagementAccess>(res)))
      .catch(() => setAccess(null))
  }, [fetchMe])

  useEffect(() => {
    if (!access?.can_open_management) return
    fetchUsers()
    if (access.can_create) {
      api.get('/api/v1/roles').then((res) => setRoles(unwrap<StoreRoleListItem[]>(res))).catch(() => {})
    }
  }, [access])

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
      render: (_role: string, record) => (
        <Tag>{record.role_name || ROLE_LABELS[record.role] || record.role}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: number, record) => (
        <Switch
          checked={status === 1}
          disabled={record.role === 'owner' || !access?.can_update}
          onChange={() => toggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    { title: '最后登录', dataIndex: 'last_login_at', render: (v) => v || '-' },
  ]

  if (access && !access.can_open_management) {
    return (
      <Card title="员工管理">
        <p style={{ margin: 0, color: '#999' }}>
          当前角色「{access.role_name}」无权管理员工，如需派工请在工单页选择技师。
        </p>
      </Card>
    )
  }

  if (!access) {
    return <Card title="员工管理" loading />
  }

  return (
    <Card
      title="员工管理"
      extra={
        access.can_create ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            新增员工
          </Button>
        ) : null
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={users} pagination={false} />

      <Modal title="新增员工" open={open} onOk={handleCreate} onCancel={() => setOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
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
          <Form.Item name="role_id" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={roles
                .filter((r) => r.slug !== 'owner')
                .map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

function WorkBaySettings() {
  const [loading, setLoading] = useState(false)
  const [bays, setBays] = useState<WorkBay[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkBay | null>(null)
  const [form] = Form.useForm()

  const fetchBays = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/v1/work-bays')
      setBays(unwrap<WorkBay[]>(res))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBays()
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'repair', status: 1, sort_order: bays.length })
    setOpen(true)
  }

  const openEdit = (bay: WorkBay) => {
    setEditing(bay)
    form.setFieldsValue(bay)
    setOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    try {
      if (editing) {
        await api.put(`/api/v1/work-bays/${editing.id}`, values)
        message.success('工位已更新')
      } else {
        await api.post('/api/v1/work-bays', values)
        message.success('工位已创建')
      }
      setOpen(false)
      fetchBays()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  const handleDelete = async (bay: WorkBay) => {
    Modal.confirm({
      title: `删除工位「${bay.name}」？`,
      onOk: async () => {
        await api.delete(`/api/v1/work-bays/${bay.id}`)
        message.success('已删除')
        fetchBays()
      },
    })
  }

  const columns: ColumnsType<WorkBay> = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v) => WORK_BAY_TYPE_OPTIONS.find((o) => o.value === v)?.label || v || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: number) => (
        <Tag color={v === 1 ? 'success' : v === 2 ? 'processing' : 'default'}>
          {WORK_BAY_STATUS_LABELS[v] || v}
        </Tag>
      ),
    },
    { title: '排序', dataIndex: 'sort_order' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="工位管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增工位
        </Button>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={bays} pagination={false} />
      <Modal
        title={editing ? '编辑工位' : '新增工位'}
        open={open}
        onOk={handleSave}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="工位名称" rules={[{ required: true }]}>
            <Input placeholder="如：1号工位" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select options={WORK_BAY_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={WORK_BAY_STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default function SettingsPage() {
  const location = useLocation()
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const defaultTab = (location.state as { tab?: string } | null)?.tab || 'store'
  const [userAccess, setUserAccess] = useState<UserManagementAccess | null>(null)

  useEffect(() => {
    fetchMe().catch(() => {})
    api
      .get('/api/v1/users/access')
      .then((res) => setUserAccess(unwrap<UserManagementAccess>(res)))
      .catch(() => setUserAccess(null))
  }, [fetchMe])
  const canStore = useAnyPermission('settings:store')
  const canUsers = Boolean(userAccess?.can_open_management)
  const canWorkBay = useAnyPermission('settings:work_bay')
  const canSubscription = useAnyPermission('settings:subscription')
  const canRoles = useAnyPermission('role:read', 'role:manage')

  const items = [
    canStore ? { key: 'store', label: '门店信息', children: <StoreSettings /> } : null,
    canUsers ? { key: 'users', label: '员工管理', children: <UserSettings /> } : null,
    canRoles ? { key: 'roles', label: '角色权限', children: <RoleSettings /> } : null,
    canWorkBay ? { key: 'work-bays', label: '工位管理', children: <WorkBaySettings /> } : null,
    canSubscription ? { key: 'subscription', label: '订阅套餐', children: <SubscriptionSettings /> } : null,
  ].filter(Boolean) as { key: string; label: string; children: React.ReactNode }[]

  return <Tabs defaultActiveKey={defaultTab} items={items} />
}
