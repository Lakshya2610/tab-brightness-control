const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const { resolve } = require("path");

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        options: resolve(__dirname, "options.html"),
      },
    },
  },
});
