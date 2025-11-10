/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phdgiqhcidqnfuwxszco.supabase.co',
        pathname: '/**'
      }
    ]
  }
};

module.exports = nextConfig;
