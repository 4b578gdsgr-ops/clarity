'use client';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Service',       href: '/' },
  { label: 'Repair or Replace?', href: '/repair-or-replace' },
  { label: 'Custom Builds', href: '/custom-builds' },
  { label: 'Membership',    href: 'https://oneloveoutdoors.org/onelove-members-only', external: true },
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
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '1rem', letterSpacing: '-0.01em' }}>One Love Outdoors</span>
        </a>
        <div style={{
          display: 'flex', gap: '0.9rem', alignItems: 'center',
          overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          paddingLeft: 8,
        }}>
          {NAV_LINKS.map(({ label, href, external }) => {
            const active = !external && (href === '/' ? pathname === '/' : pathname.startsWith(href));
            return (
              <a
                key={href}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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
