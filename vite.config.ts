
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';

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

  export default defineConfig({
    plugins: [react(), tailwindcss(), figmaAssetResolver()],
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