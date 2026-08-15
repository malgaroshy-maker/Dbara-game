import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Injects the build's hashed asset list into the service worker.
 *
 * The worker ships from `public/` and so cannot know the hashed filenames on
 * its own. Without them the first offline visit fails: those assets are
 * fetched before the worker takes control, so nothing caches them.
 */
const precacheServiceWorker = (): Plugin => {
  let assets: string[] = [];
  let outDir = 'dist';

  return {
    name: 'dbara-sw-precache',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    generateBundle(_options, bundle) {
      assets = Object.keys(bundle)
        .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
        .map((file) => `./${file}`)
        .sort();
    },
    closeBundle() {
      // Runs after the public dir has been copied into outDir.
      const swPath = resolve(outDir, 'sw.js');
      try {
        const source = readFileSync(swPath, 'utf8');
        // The build id doubles as the cache version, so a new deploy gets a
        // fresh cache and the activate handler evicts the previous one.
        const buildId = createHash('sha256')
          .update(assets.join('|'))
          .digest('hex')
          .slice(0, 8);
        writeFileSync(
          swPath,
          `self.__DBARA_PRECACHE__ = ${JSON.stringify(assets)};\n` +
            `self.__DBARA_BUILD__ = ${JSON.stringify(buildId)};\n${source}`
        );
        this.info(`service worker precaching ${assets.length} build assets (${buildId})`);
      } catch {
        // No sw.js in the output (e.g. a library build) — nothing to inject.
      }
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    precacheServiceWorker(),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Matched by module path rather than by package name: the app imports
        // `react-dom/client`, which the name-keyed form does not match, so
        // react-dom was silently ending up in the entry chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/src/data/questions/') || id.includes('\\src\\data\\questions\\')) {
              return 'questions-bank';
            }
            if (id.includes('/src/data/puzzles/') || id.includes('\\src\\data\\puzzles\\')) {
              return 'puzzles-bank';
            }
            return undefined;
          }
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils'))
            return 'motion';
          if (id.includes('lucide-react')) return 'icons';
          return undefined;
        },
      },
    },
  },
});
