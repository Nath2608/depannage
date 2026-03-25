/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@depan-express/types', '@depan-express/utils'],
  images: {
    domains: ['localhost', 'api.depanexpress.fr'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.depanexpress.fr',
      },
    ],
  },
};

module.exports = nextConfig;
