/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  staticPageGenerationTimeout: 1000,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
