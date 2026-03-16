'use client';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Service',       href: '/' },
  { label: 'Fix or Ride',   href: '/fix-or-ride' },
  { label: 'Custom Builds', href: '/custom-builds' },
  { label: 'Membership',    href: '/membership' },
  { label: 'About',         href: '/about' },
];

export default function TopNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/embed')) return null;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(250,249,246,0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e0d8',
    }}>
      <div style={{
        maxWidth: 672, margin: '0 auto', padding: '0 1rem',
        height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '0.18em', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '1rem', letterSpacing: '-0.01em' }}>Love</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d8653', fontSize: '1.35rem', lineHeight: 0.85 }}>&gt;</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '1rem', letterSpacing: '-0.01em' }}>Money</span>
        </a>
        <div style={{
          display: 'flex', gap: '0.9rem', alignItems: 'center',
          overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          paddingLeft: 8,
        }}>
          {NAV_LINKS.map(({ label, href }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: '0.72rem', fontWeight: active ? 700 : 600,
                  color: active ? '#1a6e3f' : '#2d8653',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  borderBottom: active ? '2px solid #2d8653' : '2px solid transparent',
                  paddingBottom: 2,
                }}
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
