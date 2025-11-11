/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable error overlay for handled errors in production-like behavior
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
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
