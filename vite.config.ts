import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            host: '0.0.0.0',
            port: 4174,
            clientPort: 4174,
          },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
