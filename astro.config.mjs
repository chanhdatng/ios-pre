// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: 'https://ios-pre.vercel.app',
  // base: '/ios-prep-hub', // Only needed for GitHub Pages subfolder deployment
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'zustand', 'framer-motion', 'lucide-react', 'ts-fsrs'],
    },
  },
});