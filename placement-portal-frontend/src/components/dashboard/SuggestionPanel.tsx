import { Lightbulb, Sparkles } from 'lucide-react'

export interface SuggestionItem {
  id: string
  title: string
  detail: string
}

interface SuggestionPanelProps {
  title?: string
  items: SuggestionItem[]
}

const SuggestionPanel = ({ title = 'Smart Suggestions', items }: SuggestionPanelProps) => {
  if (items.length === 0) {
    return (
      <div className="suggestion-panel">
        <div className="suggestion-head">
          <Sparkles size={16} />
          <h3>{title}</h3>
        </div>
        <p className="dashboard-empty">No suggestions right now. Keep up the great progress.</p>
      </div>
    )
  }

  return (
    <div className="suggestion-panel">
      <div className="suggestion-head">
        <Sparkles size={16} />
        <h3>{title}</h3>
      </div>
      <ul className="suggestion-list">
        {items.map((item) => (
          <li key={item.id}>
            <Lightbulb size={15} />
            <div>
              <h4>{item.title}</h4>
              <p>{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SuggestionPanel
