const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/escuelainfo' : '',
  // Only include headers when not exporting statically
  ...(isProd ? {} : {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self' https://cloud.appwrite.io https://*.firebaseio.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebase.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.google.com https://*.firebaseapp.com; frame-src 'self' https://*.firebaseapp.com https://*.firebaseio.com; connect-src 'self' https://cloud.appwrite.io wss://cloud.appwrite.io https://*.googleapis.com https://*.firebaseio.com;",
            },
          ],
        },
      ];
    },
  }),
};

module.exports = nextConfig;

