'use client';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/embed') || pathname.startsWith('/admin')) return null;

  return (
    <footer style={{ borderTop: '1px solid #e5e0d8', marginTop: 48, padding: '32px 20px 40px', textAlign: 'center', background: '#faf9f6' }}>
      <p style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 15, color: '#636e72', marginBottom: 10, lineHeight: 1.6 }}>
        No ads. No investors. No private equity. Just this.
      </p>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
        A One Love Outdoors 501(c)(3) project
      </p>
      <a
        href="mailto:service@oneloveoutdoors.org"
        style={{ fontSize: 12, color: '#2d8653', textDecoration: 'none' }}
      >
        service@oneloveoutdoors.org
      </a>
    </footer>
  );
}
