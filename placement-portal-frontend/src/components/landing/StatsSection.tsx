import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { motion, useInView } from 'framer-motion'
import { Building2, GraduationCap, HandCoins, Trophy } from 'lucide-react'
import SectionHeading from './SectionHeading'

interface StatItem {
  label: string
  value: number
  suffix: string
  icon: ComponentType<{ className?: string }>
}

const stats: StatItem[] = [
  { label: 'Students Registered', value: 500, suffix: '+', icon: GraduationCap },
  { label: 'Companies Visiting', value: 120, suffix: '+', icon: Building2 },
  { label: 'Offers Generated', value: 300, suffix: '+', icon: HandCoins },
  { label: 'Placement Rate', value: 95, suffix: '%', icon: Trophy },
]

function useCountUp(target: number, start: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return

    const duration = 1100
    const startTs = performance.now()

    const frame = (time: number) => {
      const progress = Math.min((time - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
  }, [target, start])

  return count
}

const StatCard = ({ item, start }: { item: StatItem; start: boolean }) => {
  const value = useCountUp(item.value, start)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
    >
      <item.icon className="mb-3 h-6 w-6 text-jimsBlue" />
      <p className="text-3xl font-bold text-slate-900">{value}{item.suffix}</p>
      <p className="mt-1 text-sm text-slate-600">{item.label}</p>
    </motion.div>
  )
}

const StatsSection = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const memoStats = useMemo(() => stats, [])

  return (
    <section ref={ref} className="bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Impact"
          title="Placement outcomes that reflect consistent growth"
          subtitle="Track institutional success with transparent performance indicators."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {memoStats.map((item) => (
            <StatCard key={item.label} item={item} start={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
