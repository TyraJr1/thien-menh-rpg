import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: { three: "index.html", legacy: "legacy.html" },
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/phaser/')) return 'engine';
        },
      },
    },
  },
});
