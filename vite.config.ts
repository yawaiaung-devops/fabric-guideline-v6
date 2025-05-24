import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "FabricV6Guideline",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "fabric"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          fabric: "fabric",
        },
      },
    },
    outDir: "dist",
  },
});
