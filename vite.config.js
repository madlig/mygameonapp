import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hubTarget = env.VITE_HUB_API_URL && env.VITE_HUB_API_URL.startsWith('http')
    ? env.VITE_HUB_API_URL
    : 'https://mygameon-hub.vercel.app';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: hubTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      // Biarkan Vite mengelola chunk splitting secara otomatis.
      // manualChunks dihapus karena menyebabkan TDZ error di production
      // akibat urutan load chunk yang salah (circular dependency antar chunk).
      // Code splitting sudah ditangani oleh React.lazy() di AppRouter.
      chunkSizeWarningLimit: 900,
    },
  };
});

