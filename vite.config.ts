import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-stacks': ['@stacks/connect', '@stacks/transactions', '@stacks/network'],
          'vendor-reown': ['@reown/appkit', '@reown/appkit-adapter-wagmi', 'wagmi', 'viem'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
        },
      },
    },
  },
  define: {
    // Ensure global is defined for some packages
    global: 'globalThis',
  },
}));
