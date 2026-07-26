import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
