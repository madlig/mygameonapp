import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['algoliasearch/lite'],
  },
  build: {
    // Biarkan Vite mengelola chunk splitting secara otomatis.
    // manualChunks dihapus karena menyebabkan TDZ error di production
    // akibat urutan load chunk yang salah (circular dependency antar chunk).
    // Code splitting sudah ditangani oleh React.lazy() di AppRouter.
    chunkSizeWarningLimit: 900,
  },
});
