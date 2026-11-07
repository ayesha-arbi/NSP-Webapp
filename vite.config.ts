import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import path from "node:path"

import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Vite config — https://vitejs.dev/config/

export default defineConfig({
  base: "/",

  build: {
    sourcemap: false,

    minify: true,

    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const normalized = id.replace(/\\/g, "/")

          if (
            normalized.includes("/node_modules/ethers/") ||
            id.includes("ethers")
          ) {
            return "ethers"
          }

          if (
            normalized.includes("/node_modules/react/") ||
            normalized.includes("/node_modules/react-dom/") ||
            normalized.includes("/node_modules/react-router-dom/")
          ) {
            return "vendor"
          }
        },
      },
    },
  },

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",

    port: parseInt(process.env.PORT || "8443"),

    strictPort: true,

    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",

        changeOrigin: true,

        secure: false,
      },

      "/health": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",

        changeOrigin: true,

        secure: false,
      },
    },
  },

  preview: {
    host: "0.0.0.0",

    port: parseInt(process.env.PORT || "8443"),

    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",

        changeOrigin: true,

        secure: false,
      },

      "/health": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",

        changeOrigin: true,

        secure: false,
      },
    },
  },
})
