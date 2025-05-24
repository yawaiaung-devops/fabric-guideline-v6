import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "fabric-guideline-v6",
      fileName: "fabric-guideline-v6",
      formats: ["cjs", "es", "umd"],
    },
    rollupOptions: {
      external: "fabric",
      output: {
        globals: {
          fabric: "fabric",
        },
      },
    },
  },
});
