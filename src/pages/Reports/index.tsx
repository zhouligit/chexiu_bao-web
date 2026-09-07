import { Card, Col, Row, Segmented, Statistic, Table, Typography } from 'antd'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, unwrap } from '@/services/api'
import type {
  DailyReport,
  RevenueTrendItem,
  ServiceAnalysisItem,
} from '@/types/report'

export default function ReportsPage() {
  const [daily, setDaily] = useState<DailyReport | null>(null)
  const [trendDays, setTrendDays] = useState<number>(7)
  const [trend, setTrend] = useState<RevenueTrendItem[]>([])
  const [services, setServices] = useState<ServiceAnalysisItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = async (days: number) => {
    setLoading(true)
    try {
      const [dailyRes, trendRes, serviceRes] = await Promise.all([
        api.get('/api/v1/reports/daily'),
        api.get('/api/v1/reports/revenue-trend', { params: { days } }),
        api.get('/api/v1/reports/service-analysis', { params: { days: 30 } }),
      ])
      setDaily(unwrap<DailyReport>(dailyRes))
      setTrend(unwrap<RevenueTrendItem[]>(trendRes))
      setServices(unwrap<ServiceAnalysisItem[]>(serviceRes))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll(trendDays)
  }, [trendDays])

  const chartData = trend.map((t) => ({
    date: t.date.slice(5),
    revenue: t.revenue,
    orders: t.order_count,
  }))

  return (
    <div>
      <Typography.Title level={4}>经营报表</Typography.Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="今日营收" value={daily?.revenue ?? 0} prefix="¥" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="今日台次" value={daily?.order_count ?? 0} suffix="台" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="客单价" value={daily?.avg_ticket ?? 0} prefix="¥" precision={2} />
          </Card>
        </Col>
      </Row>

      <Card
        title="营收趋势"
        loading={loading}
        extra={
          <Segmented
            options={[
              { label: '7天', value: 7 },
              { label: '30天', value: 30 },
            ]}
            value={trendDays}
            onChange={(v) => setTrendDays(v as number)}
          />
        }
        style={{ marginBottom: 16 }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value: number, name: string) => [name === 'revenue' ? `¥${value}` : value, name === 'revenue' ? '营收' : '台次']} />
            <Legend formatter={(v) => (v === 'revenue' ? '营收' : '台次')} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#1677ff" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#52c41a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="项目营收 TOP10（近30天）" loading={loading}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={services} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`¥${v}`, '营收']} />
                <Bar dataKey="amount" fill="#1677ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="项目明细" loading={loading}>
            <Table
              rowKey="name"
              pagination={false}
              size="small"
              dataSource={services}
              columns={[
                { title: '项目', dataIndex: 'name', ellipsis: true },
                { title: '次数', dataIndex: 'count', width: 60 },
                { title: '营收', dataIndex: 'amount', width: 90, render: (v) => `¥${v}` },
                { title: '占比', dataIndex: 'ratio', width: 60, render: (v) => `${v}%` },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
