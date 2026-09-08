import { LockOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Form, Input, Typography, message } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore, isAuthenticated } from '@/stores/auth'
import type { LoginResult } from '@/types/api'
import { api, unwrap } from '@/services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />
  }

  const onFinish = async (values: Record<string, string>) => {
    setLoading(true)
    try {
      const response = await api.post('/api/v1/auth/register', {
        store_name: values.store_name,
        store_phone: values.store_phone,
        store_address: values.store_address,
        username: values.username,
        password: values.password,
        name: values.name,
        phone: values.phone,
      })
      const data = unwrap<LoginResult>(response)
      useAuthStore.setState({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user,
      })
      message.success('门店注册成功')
      navigate('/dashboard')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 480, maxWidth: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          门店注册
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          开通车修宝，立即开始管理您的汽修门店
        </Typography.Paragraph>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Typography.Text strong>门店信息</Typography.Text>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="store_name" label="门店名称" rules={[{ required: true, message: '请输入门店名称' }]}>
            <Input prefix={<ShopOutlined />} placeholder="如：XX汽修店" />
          </Form.Item>
          <Form.Item name="store_phone" label="门店电话">
            <Input placeholder="400-000-0000" />
          </Form.Item>
          <Form.Item name="store_address" label="门店地址">
            <Input placeholder="详细地址" />
          </Form.Item>

          <Typography.Text strong>管理员账号</Typography.Text>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="name" label="您的姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input prefix={<UserOutlined />} placeholder="老板/店长姓名" />
          </Form.Item>
          <Form.Item name="phone" label="您的手机">
            <Input placeholder="手机号" />
          </Form.Item>
          <Form.Item name="username" label="登录用户名" rules={[{ required: true, min: 3, message: '至少3个字符' }]}>
            <Input placeholder="用于登录的用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="登录密码"
            rules={[{ required: true, min: 6, message: '至少6位密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="至少6位" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('两次密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            注册并登录
          </Button>
        </Form>
        <Typography.Paragraph style={{ textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          已有账号？ <Link to="/login">去登录</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
