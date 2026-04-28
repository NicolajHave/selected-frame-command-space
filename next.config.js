/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent pdfkit and other server-only modules from being bundled for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        zlib: false,
        stream: false,
        crypto: false,
      };
    }
    return config;
  },
}
module.exports = nextConfig
