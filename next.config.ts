import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones de rendimiento
  reactStrictMode: true,
  
  // Configuración de imágenes (si las usas)
  images: {
    domains: [],
  },
  
  // Configuración experimental para mejor rendimiento
  experimental: {
    // Optimizar el tamaño del bundle
    optimizeCss: true,
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
