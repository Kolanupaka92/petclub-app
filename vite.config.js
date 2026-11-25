// Author: Sai Kolanupaka
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  plugins: [react()],

  define: {
    __APP_VERSION__: JSON.stringify(version),
  },

  build: {
    // mapbox-gl is a monolithic 1.8 MB bundle — it cannot be split further.
    // It lives in its own vendor chunk with an immutable content-hash so
    // users only download it once per mapbox-gl version upgrade.
    // Raise the limit past 1800 kB to suppress the expected warning.
    chunkSizeWarningLimit: 1900,

    rollupOptions: {
      output: {
        // Split heavy third-party libraries into separate vendor chunks so
        // they are cached independently of app code. Each chunk gets an
        // immutable content-hash filename (vercel.json already sets
        // Cache-Control: immutable on /assets/*).
        manualChunks: (id) => {
          // mapbox-gl — ~1.8 MB minified; monolithic, not splittable
          if (id.includes("node_modules/mapbox-gl")) return "vendor-mapbox";

          // Firebase auth — largest firebase piece, split for fine-grained caching
          if (id.includes("node_modules/firebase/auth") ||
              id.includes("node_modules/@firebase/auth"))  return "vendor-firebase-auth";

          // Firebase messaging (FCM push notifications)
          if (id.includes("node_modules/firebase/messaging") ||
              id.includes("node_modules/@firebase/messaging")) return "vendor-firebase-messaging";

          // All remaining firebase/* and @firebase/* packages in one chunk
          // (avoids the circular-reference warning that per-package splitting causes)
          if (id.includes("node_modules/firebase") ||
              id.includes("node_modules/@firebase"))       return "vendor-firebase";

          // React runtime — cached independently of app code
          if (id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react/"))          return "vendor-react";
        },
      },
    },
  },
});
