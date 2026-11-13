import path from "node:path";

const rawBackendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";
const backendUrl = (
  /^https?:\/\//i.test(rawBackendUrl) ? rawBackendUrl : `http://${rawBackendUrl}`
).replace(/\/+$/, "");

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
