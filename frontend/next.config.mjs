import path from "node:path";

const configuredBackendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");
const backendUrl = /^https?:\/\//i.test(configuredBackendUrl)
  ? configuredBackendUrl
  : `https://${configuredBackendUrl}`;

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(".."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
