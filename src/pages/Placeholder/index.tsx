import { Card, Typography } from 'antd'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Typography.Text type="secondary">功能开发中，敬请期待。</Typography.Text>
    </Card>
  )
}

export const SettingsPage = () => <PlaceholderPage title="系统设置" />
