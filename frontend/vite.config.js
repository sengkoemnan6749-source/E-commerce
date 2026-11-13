import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const isVercel = process.env.VERCEL === '1';
  // Use /E-commerce/ for GitHub Pages production build, / for local dev or Vercel
  const base = (command === 'build' && !isVercel) ? '/E-commerce/' : '/';

  return {
    plugins: [
      react(),
      {
        name: 'rewrite-images-for-gh-pages',
        enforce: 'pre',
        transform(code, id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('/src/') && /\.[jt]sx?$/.test(normalized)) {
            if (base !== '/') {
              return {
                code: code
                  .split('"/images/').join(`"${base}images/`)
                  .split("'/images/").join(`'${base}images/`)
                  .split('`/images/').join(`\`${base}images/`)
                  .split('"/icons/').join(`"${base}icons/`)
                  .split("'/icons/").join(`'${base}icons/`)
                  .split('`/icons/').join(`\`${base}icons/`),
                map: null
              };
            }
          }
          return null;
        }
      }
    ],
    base: base,
    server: {
      port: 3000,
      open: false,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    }
  };
});
