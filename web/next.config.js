/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://longivity-production.up.railway.app',
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
