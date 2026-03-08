import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend: number
  loading?: boolean
}

const MetricCard = ({ icon: Icon, label, value, trend, loading = false }: MetricCardProps) => {
  const trendUp = trend >= 0

  return (
    <motion.article
      className="metric-card"
      whileHover={{ y: -4, boxShadow: '0 14px 36px rgba(28, 64, 153, 0.2)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="metric-card-top">
        <span className="metric-icon">
          <Icon size={18} />
        </span>
        <span className={`metric-trend ${trendUp ? 'up' : 'down'}`}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trendUp ? '+' : ''}
          {trend}%
        </span>
      </div>
      <div className="metric-value-wrap">
        {loading ? <div className="skeleton-line metric-value-skeleton" /> : <strong>{value}</strong>}
        <span>{label}</span>
      </div>
    </motion.article>
  )
}

export default MetricCard
