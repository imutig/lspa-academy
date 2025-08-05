/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations pour Vercel
  output: 'standalone',
  
  // Gestion des images
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  
  // Variables d'environnement exposées
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  
  // Optimisations de build
  swcMinify: true,
  
  // Configuration Prisma pour Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
