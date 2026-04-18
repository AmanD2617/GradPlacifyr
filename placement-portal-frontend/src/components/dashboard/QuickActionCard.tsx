import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface QuickActionCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
  /** When provided the card renders as a button and calls this handler instead of navigating via `to`. */
  onClick?: () => void
}

const QuickActionCard = ({ to, title, description, icon: Icon, onClick }: QuickActionCardProps) => {
  const inner = (
    <>
      <span className="quick-action-icon">
        <Icon size={18} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </>
  )

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
      {onClick ? (
        <button className="quick-action-card" onClick={onClick} type="button">
          {inner}
        </button>
      ) : (
        <Link className="quick-action-card" to={to}>
          {inner}
        </Link>
      )}
    </motion.div>
  )
}

export default QuickActionCard
