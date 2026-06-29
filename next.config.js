/** @type {import('next').NextConfig} */

// /embed/* must be allowed to render inside an iframe on host sites. We
// override X-Frame-Options/CSP for that path so Vercel's defaults don't block
// embedding. Set EMBED_ALLOWED_ORIGINS (comma-separated) in Vercel to lock it
// down to specific hosts, e.g. "https://intranet.bestseller.com,https://*.bestseller.com".
// Leave it unset to allow any host.
const allowedOrigins = (process.env.EMBED_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const frameAncestors = allowedOrigins.length ? allowedOrigins.join(" ") : "*";

const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
        ],
      },
    ];
  },
}
module.exports = nextConfig
