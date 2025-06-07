import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import JavaScriptObfuscator from "javascript-obfuscator";

// Custom Vite plugin to obfuscate after build
function obfuscatorPlugin() {
  return {
    name: 'vite-obfuscator',
    apply: 'build',
    enforce: 'post',
    generateBundle(options, bundle) {
      for (const file in bundle) {
        if (file.endsWith('.js')) {
          const chunk = bundle[file];
          if (chunk.type === 'chunk') {
            const obfuscationResult = JavaScriptObfuscator.obfuscate(chunk.code, {
              rotateStringArray: true,
              stringArray: true,
              stringArrayEncoding: ['rc4'], // Optional: makes it harder to reverse
              stringArrayThreshold: 0.75,
            });
            chunk.code = obfuscationResult.getObfuscatedCode();
          }
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
    ...(process.env.NODE_ENV === "production" ? [obfuscatorPlugin()] : []), // Add obfuscation in production
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});
