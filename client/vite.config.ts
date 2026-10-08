import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

// pictures are uploaded to and served from this bucket
const BUCKET = "https://my-odin-bucket.s3.eu-west-2.amazonaws.com";

// only the built app gets a policy, the dev server needs inline scripts for hot reload
function contentSecurityPolicy(apiUrl: string): Plugin {
  const api = apiUrl ? new URL(apiUrl).origin : "";
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${BUCKET}`,
    `connect-src 'self' ${api} ${BUCKET}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return {
    name: "content-security-policy",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: policy },
        injectTo: "head-prepend",
      },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_API_URL ?? "")],
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
  };
});
