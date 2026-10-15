import {
  DashboardOutlined,
  TeamOutlined,
  FileTextOutlined,
  InboxOutlined,
  BarChartOutlined,
  SettingOutlined,
  ToolOutlined,
  ShopOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography, Dropdown, Space, Alert, Button, theme } from 'antd'
import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout

const MENU_DEF: { key: string; icon: React.ReactNode; label: string; permission: string }[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '首页看板', permission: 'menu:dashboard' },
  { key: '/work-orders', icon: <FileTextOutlined />, label: '工单管理', permission: 'menu:work_orders' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户管理', permission: 'menu:customers' },
  { key: '/services', icon: <ToolOutlined />, label: '服务项目', permission: 'menu:services' },
  { key: '/inventory', icon: <InboxOutlined />, label: '库存管理', permission: 'menu:inventory' },
  { key: '/suppliers', icon: <ShopOutlined />, label: '供应商', permission: 'menu:suppliers' },
  { key: '/payments', icon: <DollarOutlined />, label: '收退款', permission: 'menu:payments' },
  { key: '/reports', icon: <BarChartOutlined />, label: '经营报表', permission: 'menu:reports' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置', permission: 'menu:settings' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    fetchMe().catch(() => {})
  }, [fetchMe])
  const subscription = user?.subscription
  const { token } = theme.useToken()
  const menuItems: MenuProps['items'] = MENU_DEF.filter((item) =>
    (user?.permissions ?? []).includes(item.permission),
  ).map(({ key, icon, label }) => ({ key, icon, label }))

  const userMenu: MenuProps['items'] = [
    { key: 'logout', label: '退出登录', onClick: () => { logout(); navigate('/login') } },
  ]

  const selectedKey =
    MENU_DEF.find((item) => location.pathname.startsWith(item.key))?.key ||
    menuItems?.[0]?.key?.toString() ||
    '/dashboard'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64} theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            车修宝
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography.Text type="secondary">
            {user?.store?.name || '演示汽修店'}
          </Typography.Text>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <span>{user?.name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          {subscription?.message && (
            <Alert
              type={subscription.can_write ? 'warning' : 'error'}
              showIcon
              message={subscription.message}
              action={
                <Button size="small" onClick={() => navigate('/settings', { state: { tab: 'subscription' } })}>
                  查看套餐
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
