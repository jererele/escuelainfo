import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EscuelaInfo — Escuela N° 713',
    short_name: 'EscuelaInfo',
    description: 'Sistema de gestión escolar y ausencias · Escuela N° 713 Juan Abdala Chayep',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0b0f17',
    theme_color: '#0b0f17',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
