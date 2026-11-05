import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@wagmi/core/tempo': path.resolve(__dirname, 'src/empty.ts'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  define: {
    'process.env': {},
  },
});
