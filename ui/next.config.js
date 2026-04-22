/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a standalone server bundle that includes all API routes and RSC
  // endpoints. Without this, Firebase Frameworks can deploy a partial bundle
  // that serves static pages but 404s on /api/** and RSC payloads.
  output: 'standalone',
};

module.exports = nextConfig;
