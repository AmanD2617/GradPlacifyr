import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickActionCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

const QuickActionCard = ({ to, title, description, icon: Icon }: QuickActionCardProps) => {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      <Link className="quick-action-card" to={to}>
        <span className="quick-action-icon">
          <Icon size={18} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export default QuickActionCard
