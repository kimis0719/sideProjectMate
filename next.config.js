/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add this if you're using CSS modules
  experimental: {
    serverComponentsExternalPackages: ['@radix-ui/react-dialog'],
  },
  // Add this if you're using path aliases
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
