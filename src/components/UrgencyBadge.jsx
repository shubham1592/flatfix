const urgencyConfig = {
  1: { label: 'Low', class: 'badge-low', dot: 'bg-mint-400' },
  2: { label: 'Medium', class: 'badge-medium', dot: 'bg-yellow-400' },
  3: { label: 'High', class: 'badge-high', dot: 'bg-orange-400' },
  4: { label: 'Urgent', class: 'badge-urgent', dot: 'bg-red-400' },
}

export default function UrgencyBadge({ urgency }) {
  const config = urgencyConfig[urgency] || urgencyConfig[1]

  return (
    <span className={`badge ${config.class}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

export const categoryIcons = {
  trash: '🗑️',
  dishes: '🍽️',
  bathroom: '🚿',
  kitchen: '🍳',
  grocery: '🛒',
  general: '📌',
}

export function CategoryTag({ category }) {
  return (
    <span className="badge bg-cream-200 text-gray-600 dark:bg-dark-border dark:text-dark-muted">
      <span>{categoryIcons[category] || '📌'}</span>
      {category}
    </span>
  )
}
