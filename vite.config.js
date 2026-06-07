import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html',
        productDetail: './product-detail.html',
        productCenter: './product-center.html',
        applications: './applications.html'
      }
    }
  }
});
