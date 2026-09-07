import { Card, Col, Row, Statistic, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { api, unwrap } from '@/services/api'
import type { OverviewReport } from '@/types/report'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<OverviewReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/v1/reports/overview')
      .then((res) => setData(unwrap<OverviewReport>(res)))
      .finally(() => setLoading(false))
  }, [])

  const today = data?.today

  return (
    <div>
      <Typography.Title level={4}>欢迎回来，{user?.name}</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        今日经营概览 · <Link to="/reports">查看详细报表</Link>
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="今日营收" value={today?.revenue ?? 0} prefix="¥" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="今日台次" value={today?.order_count ?? 0} suffix="台" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="施工中" value={today?.in_progress ?? 0} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="待结算" value={today?.pending_settle ?? 0} suffix="单" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="本月营收" value={data?.month_revenue ?? 0} prefix="¥" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="本月台次" value={data?.month_order_count ?? 0} suffix="台" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic title="客户总数" value={data?.total_customers ?? 0} suffix="人" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="库存预警"
              value={data?.low_stock_count ?? 0}
              suffix="种"
              valueStyle={data?.low_stock_count ? { color: '#faad14' } : undefined}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
