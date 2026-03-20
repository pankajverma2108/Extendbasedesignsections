/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }

    return config;
  },
};

export default nextConfig;
