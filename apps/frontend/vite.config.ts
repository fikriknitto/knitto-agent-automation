import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {  const env = loadEnv(mode, process.cwd(), "");
  const backendHost = env.VITE_BACKEND_HOST || "localhost";
  const backendPort = env.VITE_BACKEND_PORT || "3080";
  const devPort = Number(env.VITE_DEV_PORT || "3000");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    envDir: process.cwd(),    server: {
      port: devPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
        "/ws": {
          target: `ws://${backendHost}:${backendPort}`,
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
    },
  };
});
