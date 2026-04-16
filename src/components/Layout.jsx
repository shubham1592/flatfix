import { Outlet, Link } from 'react-router-dom'
import BottomNav from './BottomNav'

const moreLinks = [
  { to: '/grocery', icon: '🛒', label: 'Grocery' },
  { to: '/rules', icon: '📜', label: 'House Rules' },
  { to: '/history', icon: '📖', label: 'Fix History' },
  { to: '/templates', icon: '📋', label: 'Templates' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream-100 dark:bg-dark-bg transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg
        border-b border-cream-200 dark:border-dark-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:animate-pop">🔧</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blush-400 to-blush-600
              bg-clip-text text-transparent">
              FlatFix
            </h1>
          </Link>
          <MoreMenu links={moreLinks} />
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}

function MoreMenu({ links }) {
  return (
    <div className="relative group">
      <button className="w-9 h-9 rounded-full bg-cream-200 dark:bg-dark-border
        flex items-center justify-center text-lg hover:bg-cream-300
        dark:hover:bg-dark-bg transition-colors">
        ⋯
      </button>
      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card
        rounded-cutest shadow-soft-lg border border-cream-200 dark:border-dark-border
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200 z-50 overflow-hidden">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 px-4 py-3 hover:bg-cream-100
              dark:hover:bg-dark-border transition-colors text-sm font-medium
              text-gray-700 dark:text-dark-text"
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
