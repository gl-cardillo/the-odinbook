import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rolldownOptions: {
      output: {
        // libraries change less often than the app, so browsers keep them cached
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules[/\\](react|react-dom|react-router|scheduler)[/\\]/,
            },
            { name: "vendor", test: /node_modules[/\\]/ },
          ],
        },
      },
    },
  },
});
