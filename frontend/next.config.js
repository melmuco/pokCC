/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  experimental: {
    serverActions: {
      bodySize: 1024 * 1024 * 10,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokeco.com',
      },
      {
        protocol: 'https',
        hostname: '**.pokeco.com',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '4000',
      },
    ],
  },
};

module.exports = nextConfig;
