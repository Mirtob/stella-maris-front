
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';
  import { execSync } from 'node:child_process';

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

  /** El commit con el que se compiló, si hay git a mano. Nunca revienta la compilación. */
  function gitSha(): string {
    try {
      return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return '';
    }
  }

  export default defineConfig({
    plugins: [react(), tailwindcss(), figmaAssetResolver()],
    /**
     * Sello de la compilación, para saber QUÉ VERSIÓN corre cada aparato.
     *
     * El 25-sep-2026 una tablet mostraba en el folleto la partitura completa cuando el
     * teléfono y el PC mostraban la correcta. El camino del folleto no se bifurca por
     * dispositivo, así que solo podía ser un bundle viejo en caché — pero no había forma
     * de comprobarlo: la app no decía en ninguna parte qué versión era. Media hora de
     * diagnóstico por un dato que cabe en una línea.
     *
     * En Vercel el SHA lo pone la propia plataforma; en local sale de git.
     */
    define: {
      __BUILD_ID__: JSON.stringify(
        (process.env.VERCEL_GIT_COMMIT_SHA || gitSha() || 'local').slice(0, 7),
      ),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      // Vaciar la carpeta antes de compilar: se habían acumulado TODAS las compilaciones
      // anteriores (5.654 archivos, 642 MB) y mirar build/ ya no decía qué se generó de
      // verdad. Ojo: en Windows esta opción no siempre limpia — si vuelve a crecer, un
      // `rm -rf build` antes de compilar lo resuelve. No afecta al despliegue, que
      // compila en limpio.
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: true,
    },
  });