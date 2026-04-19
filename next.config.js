/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Service worker: allow full scope
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // Embed routes: allow framing from Squarespace + our own domain
        source: '/embed/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *.squarespace.com *.sqsp.com *.oneloveoutdoors.org oneloveoutdoors.org",
          },
          // Must NOT send X-Frame-Options on embed routes — it would block iframing
        ],
      },
      {
        // All other routes: allow framing only from our own domain
        source: '/((?!embed).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://oneloveoutdoors.org https://*.oneloveoutdoors.org",
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
