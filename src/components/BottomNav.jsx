import { NavLink } from 'react-router-dom'
import { useFixes } from '../hooks/useFixes'

const tabs = [
  { to: '/', icon: '🏠', activeIcon: '🏡', label: 'Home' },
  { to: '/rotations', icon: '🔄', activeIcon: '🔁', label: 'Rotations' },
  { to: '/dashboard', icon: '📊', activeIcon: '📈', label: 'Dashboard' },
  { to: '/profile', icon: '👤', activeIcon: '🙋', label: 'Profile' },
]

export default function BottomNav() {
  const { fixes } = useFixes()
  const urgentCount = fixes.filter(f => f.status === 'open' && f.urgency === 4).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-dark-card/90
      backdrop-blur-lg border-t border-cream-200 dark:border-dark-border safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all duration-200
              ${isActive
                ? 'text-blush-500 bg-blush-100/60 dark:bg-blush-500/10'
                : 'text-gray-400 dark:text-dark-muted hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <span className="text-xl">{isActive ? tab.activeIcon : tab.icon}</span>
                  {tab.to === '/' && urgentCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-400 text-white
                      text-[10px] font-bold rounded-full flex items-center justify-center
                      animate-pulse-soft">
                      {urgentCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
