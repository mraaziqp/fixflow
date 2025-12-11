import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FixFlow Repair OS',
    short_name: 'FixFlow',
    description: 'Console Repair Management System',
    start_url: '/',
    display: 'standalone', // This removes the browser UI (URL bar)
    background_color: '#121212', // Matches your background color
    theme_color: '#121212',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
