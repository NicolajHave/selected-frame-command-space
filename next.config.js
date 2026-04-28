/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Critical for pdfkit on Vercel: the .afm font metric files in node_modules/pdfkit/js/data/
  // are not bundled by default in serverless functions, causing ENOENT at runtime.
  // We tell Next.js to include them in the deployment.
  experimental: {
    outputFileTracingIncludes: {
      '/api/send-quote': [
        './node_modules/pdfkit/js/data/**/*',
      ],
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent server-only modules from being bundled for the browser
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
