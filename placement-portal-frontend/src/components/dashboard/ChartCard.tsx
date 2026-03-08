import { lazy, Suspense } from 'react'

export type ChartSeries = {
  key: string
  label: string
  color: string
}

type DonutData = {
  kind: 'donut'
  data: Array<{ name: string; value: number }>
}

type LineData = {
  kind: 'line'
  data: Array<Record<string, string | number>>
  xKey: string
  series: ChartSeries[]
}

type BarData = {
  kind: 'bar'
  data: Array<Record<string, string | number>>
  xKey: string
  series: ChartSeries[]
}

export type ChartConfig = DonutData | LineData | BarData

interface ChartCardProps {
  title: string
  subtitle?: string
  config: ChartConfig
  loading?: boolean
}

const LazyChartRenderer = lazy(() => import('./DashboardCharts'))

const ChartCard = ({ title, subtitle, config, loading = false }: ChartCardProps) => {
  return (
    <article className="chart-card">
      <div className="chart-card-head">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {loading ? (
        <div className="skeleton-block chart-skeleton" />
      ) : (
        <Suspense fallback={<div className="skeleton-block chart-skeleton" />}>
          <LazyChartRenderer config={config} />
        </Suspense>
      )}
    </article>
  )
}

export default ChartCard
