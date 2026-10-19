/** @type {import("next").NextConfig} */
const nextConfig = {
  // Next.js handles all /api routes internally via src/pages/api/[[...all]].js
  // without needing a separate backend server!
  async rewrites() {
    if (process.env.EXTERNAL_BACKEND_URL) {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.EXTERNAL_BACKEND_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
