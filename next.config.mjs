/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Increase server action body size limit to 3mb to allow larger uploads
      bodySizeLimit: '3mb'
    }
  }
};

export default nextConfig;
