import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['algoliasearch/lite'],
  },
  build: {
    // Naikkan limit warning supaya tidak bising; chunk besar sudah dipisah manual.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Pisahkan vendor besar ke chunk sendiri agar:
        // - landing page tidak mengunduh kode admin/search yang tidak perlu
        // - cache browser tetap valid saat kode app berubah
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase')) return 'vendor-firebase';
          if (
            id.includes('algoliasearch') ||
            id.includes('instantsearch') ||
            id.includes('react-instantsearch')
          )
            return 'vendor-algolia';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('sweetalert2')) return 'vendor-sweetalert';
          if (id.includes('react-datepicker') || id.includes('react-select'))
            return 'vendor-forms';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router')
          )
            return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
});
