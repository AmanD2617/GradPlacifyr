export interface TimelineItem {
  id: string | number
  title: string
  description: string
  time: string
  tone?: 'default' | 'success' | 'warning'
}

interface ActivityTimelineProps {
  items: TimelineItem[]
  emptyText: string
}

const ActivityTimeline = ({ items, emptyText }: ActivityTimelineProps) => {
  if (items.length === 0) {
    return <p className="dashboard-empty">{emptyText}</p>
  }

  return (
    <ul className="activity-timeline">
      {items.map((item) => (
        <li key={item.id} className="activity-item">
          <span className={`activity-dot ${item.tone ?? 'default'}`} />
          <div className="activity-content">
            <h4>{item.title}</h4>
            <p>{item.description}</p>
            <time>{item.time}</time>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ActivityTimeline
