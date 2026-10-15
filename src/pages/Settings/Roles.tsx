import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { api, unwrap } from '@/services/api'
import type { PermissionCatalogItem, StoreRoleDetail, StoreRoleListItem } from '@/types/api'
import { usePermission } from '@/hooks/usePermission'

const MODULE_LABELS: Record<string, string> = {
  menu: '菜单',
  work_order: '工单',
  customer: '客户',
  appointment: '预约',
  service: '服务项目',
  inventory: '库存',
  supplier: '供应商',
  payment: '收退款',
  report: '报表',
  settings: '系统设置',
  subscription: '订阅',
  user: '员工',
  role: '角色权限',
  common: '通用',
}

export default function RoleSettings() {
  const canManage = usePermission('role:manage')
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<StoreRoleListItem[]>([])
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<StoreRoleDetail | null>(null)
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, catalogRes] = await Promise.all([
        api.get('/api/v1/roles'),
        api.get('/api/v1/roles/permissions-catalog'),
      ])
      setRoles(unwrap<StoreRoleListItem[]>(rolesRes))
      setCatalog(unwrap<PermissionCatalogItem[]>(catalogRes))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const catalogByModule = useMemo(() => {
    const map = new Map<string, PermissionCatalogItem[]>()
    for (const item of catalog) {
      const list = map.get(item.module) ?? []
      list.push(item)
      map.set(item.module, list)
    }
    return map
  }, [catalog])

  const openEdit = async (roleId: number) => {
    try {
      const res = await api.get(`/api/v1/roles/${roleId}`)
      const detail = unwrap<StoreRoleDetail>(res)
      setEditing(detail)
      form.setFieldsValue({
        name: detail.name,
        permission_codes: detail.permission_codes,
        work_order_assigned_only: detail.data_policy?.work_order?.visibility === 'assigned_only',
      })
      setEditOpen(true)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载角色失败')
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    const values = await form.validateFields()
    const data_policy = {
      ...editing.data_policy,
      work_order: {
        visibility: values.work_order_assigned_only ? 'assigned_only' : 'store',
      },
    }
    try {
      await api.put(`/api/v1/roles/${editing.id}`, {
        name: values.name,
        permission_codes: values.permission_codes,
        data_policy,
      })
      message.success('角色已保存')
      setEditOpen(false)
      load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    }
  }

  const handleCreate = async () => {
    const values = await createForm.validateFields()
    try {
      await api.post('/api/v1/roles', {
        name: values.name,
        copy_from_id: values.copy_from_id,
        permission_codes: values.permission_codes ?? [],
      })
      message.success('角色已创建')
      setCreateOpen(false)
      createForm.resetFields()
      load()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建失败')
    }
  }

  const columns: ColumnsType<StoreRoleListItem> = [
    { title: '名称', dataIndex: 'name' },
    { title: '标识', dataIndex: 'slug', render: (v) => <Tag>{v}</Tag> },
    {
      title: '类型',
      dataIndex: 'is_system',
      render: (v) => (v ? '系统预设' : '自定义'),
    },
    { title: '员工数', dataIndex: 'user_count' },
    { title: '权限数', dataIndex: 'permission_count' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEdit(record.id)}>
            {canManage && record.slug !== 'owner' ? '编辑' : '查看'}
          </Button>
        </Space>
      ),
    },
  ]

  const permissionFields = (disabled: boolean) => (
    <Form.Item name="permission_codes" label="功能权限">
      <Checkbox.Group style={{ width: '100%' }} disabled={disabled}>
        <Collapse
          items={[...catalogByModule.entries()].map(([module, items]) => ({
            key: module,
            label: MODULE_LABELS[module] || module,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((p) => (
                  <Checkbox key={p.code} value={p.code}>
                    {p.name}
                    {p.is_sensitive ? <Tag color="red" style={{ marginLeft: 8 }}>敏感</Tag> : null}
                  </Checkbox>
                ))}
              </div>
            ),
          }))}
        />
      </Checkbox.Group>
    </Form.Item>
  )

  return (
    <Card
      title="角色与权限"
      extra={
        canManage ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新建角色
          </Button>
        ) : null
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={roles} pagination={false} />

      <Modal
        title={editing?.slug === 'owner' ? '查看角色' : '编辑角色'}
        open={editOpen}
        onOk={saveEdit}
        onCancel={() => setEditOpen(false)}
        width={720}
        okButtonProps={{ disabled: !canManage || editing?.slug === 'owner' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input disabled={!canManage || editing?.slug === 'owner'} />
          </Form.Item>
          <Form.Item
            name="work_order_assigned_only"
            label="工单数据范围"
            valuePropName="checked"
          >
            <Switch
              disabled={!canManage || editing?.slug === 'owner'}
              checkedChildren="仅本人相关"
              unCheckedChildren="全店"
            />
          </Form.Item>
          {permissionFields(!canManage || editing?.slug === 'owner')}
        </Form>
      </Modal>

      <Modal title="新建角色" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)} width={720}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
            <Input placeholder="如：前台（可退款）" />
          </Form.Item>
          <Form.Item name="copy_from_id" label="从模板复制">
            <Select
              allowClear
              placeholder="可选，复制已有角色权限"
              options={roles.filter((r) => r.slug !== 'owner').map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          {permissionFields(false)}
        </Form>
      </Modal>
    </Card>
  )
}
