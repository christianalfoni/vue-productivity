import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vueJsx()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: fileURLToPath(new URL("../../core/packages/vue", import.meta.url)),
    },
  },
});
