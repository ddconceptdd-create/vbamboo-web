import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [480, 640, 828, 1080, 1280, 1600, 1920, 2400],
  },
  // Content editor (Decap CMS) lives in public/admin/.
  async redirects() {
    return [{ source: '/admin', destination: '/admin/index.html', permanent: false }];
  },
  // Photos are copied from content/ to /public/content at build time; keep them cached.
  async headers() {
    return [
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/content/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ];
  },
};

export default nextConfig;
