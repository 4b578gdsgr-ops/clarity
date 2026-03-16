'use client';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname();

  // Hide nav on embed routes — they run inside iframes on external sites
  if (pathname.startsWith('/embed')) return null;

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(250,249,246,0.92)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #e5e0d8',
    }}>
      <div style={{ maxWidth: 672, margin: '0 auto', padding: '0 1rem', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '0.18em' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '1rem', letterSpacing: '-0.01em' }}>Love</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d8653', fontSize: '1.35rem', lineHeight: 0.85 }}>&gt;</span>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, color: '#2d3436', fontSize: '1rem', letterSpacing: '-0.01em' }}>Money</span>
        </a>
        <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>Find a Bike</a>
          <a href="/custom-builds" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>Custom Builds</a>
          <a href="/schedule-service" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>Service</a>
          <a href="/membership" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d8653', textDecoration: 'none' }}>Membership</a>
          <a href="/about" style={{ fontSize: '0.75rem', color: '#636e72', textDecoration: 'none' }}>About</a>
        </div>
      </div>
    </nav>
  );
}
