/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xmcvgrjfwjdriqklczxs.supabase.co',
        // You can restrict the pathname further if needed, e.g.:
        // pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer: _isServer }) => {
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ }
    ];
    return config;
  },
}

module.exports = nextConfig 