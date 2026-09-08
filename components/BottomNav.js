import Link from 'next/link';

const items = [
  { key: 'play', href: '/dashboard', icon: '🎲', label: 'Play' },
  { key: 'wallet', href: '/wallet', icon: '▣', label: 'Wallet' },
  { key: 'history', href: '/wallet', icon: '↻', label: 'History' },
  { key: 'profile', href: '/profile', icon: '●', label: 'Profile' }
];

export default function BottomNav({ active = 'play' }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <Link key={item.key} href={item.href} className={active === item.key ? 'active' : ''}>
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
