const avatars = [
  {
    id: 'cat',
    name: 'Whiskers',
    emoji: '🐱',
    color: '#f9a8b8',
    bg: '#fde8ed',
  },
  {
    id: 'dog',
    name: 'Biscuit',
    emoji: '🐶',
    color: '#fb9f6f',
    bg: '#fef0e7',
  },
  {
    id: 'panda',
    name: 'Mochi',
    emoji: '🐼',
    color: '#9594a8',
    bg: '#f0ebfa',
  },
  {
    id: 'fox',
    name: 'Maple',
    emoji: '🦊',
    color: '#fb9f6f',
    bg: '#fef0e7',
  },
  {
    id: 'penguin',
    name: 'Waddle',
    emoji: '🐧',
    color: '#80dfb6',
    bg: '#e6f7f0',
  },
  {
    id: 'owl',
    name: 'Luna',
    emoji: '🦉',
    color: '#ab94e8',
    bg: '#f0ebfa',
  },
  {
    id: 'unicorn',
    name: 'Sparkle',
    emoji: '🦄',
    color: '#f5a0b7',
    bg: '#fde8ed',
  },
  {
    id: 'robot',
    name: 'Beep',
    emoji: '🤖',
    color: '#80dfb6',
    bg: '#e6f7f0',
  },
  {
    id: 'cactus',
    name: 'Prickle',
    emoji: '🌵',
    color: '#4dd399',
    bg: '#e6f7f0',
  },
  {
    id: 'mushroom',
    name: 'Truffle',
    emoji: '🍄',
    color: '#e8537e',
    bg: '#fde8ed',
  },
  {
    id: 'sun',
    name: 'Sunny',
    emoji: '🌞',
    color: '#fbb848',
    bg: '#fef6e7',
  },
  {
    id: 'cloud',
    name: 'Fluffy',
    emoji: '☁️',
    color: '#87ceeb',
    bg: '#e8f4fd',
  },
]

export default avatars

export function getAvatar(avatarId) {
  return avatars.find(a => a.id === avatarId) || avatars[0]
}

export function getTierInfo(stars) {
  if (stars >= 20) return { name: 'Fix god', icon: '👑', color: '#fbb848' }
  if (stars >= 11) return { name: 'Fix legend', icon: '🏆', color: '#fb9f6f' }
  if (stars >= 6) return { name: 'Fix hero', icon: '⭐', color: '#f5a0b7' }
  if (stars >= 3) return { name: 'Fix enthusiast', icon: '🌟', color: '#80dfb6' }
  return { name: 'Rookie fixer', icon: '🌱', color: '#b8c8a8' }
}
