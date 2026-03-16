/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow framing from Squarespace domain
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://oneloveoutdoors.org https://*.oneloveoutdoors.org https://*.squarespace.com https://*.sqsp.com",
          },
          // Legacy header (not supported in Chrome/Firefox but kept for compatibility)
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
