import { getAvatar } from '../data/avatars'

export default function Avatar({ avatarId, size = 'md', showRing = false, isStar = false }) {
  const avatar = getAvatar(avatarId)
  const sizes = {
    xs: 'w-7 h-7 text-sm',
    sm: 'w-9 h-9 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  }

  return (
    <div className="relative inline-flex">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center
          ${showRing ? 'ring-2 ring-blush-300 ring-offset-2' : ''}
          transition-transform duration-200 hover:scale-105`}
        style={{ backgroundColor: avatar.bg }}
      >
        <span role="img" aria-label={avatar.name}>{avatar.emoji}</span>
      </div>
      {isStar && (
        <span className="absolute -top-1 -right-1 text-sm animate-float">⭐</span>
      )}
    </div>
  )
}
