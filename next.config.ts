/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. 타입스크립트 에러가 있어도 무시하고 빌드해라!
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. ESLint 에러가 있어도 무시해라!
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;