/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  webpack: (config) => {
    config.externals.push({
      canvas: 'commonjs canvas',
    })
    return config
  },
}

module.exports = nextConfig