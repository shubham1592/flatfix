export default function EmptyState({ emoji = '✨', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4 animate-float">{emoji}</span>
      <h3 className="text-lg font-bold text-gray-700 dark:text-dark-text mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-dark-muted max-w-xs">
          {subtitle}
        </p>
      )}
    </div>
  )
}
