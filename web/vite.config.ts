// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:5001/tool-tracker-c8180/us-central1/api',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");

//   return {
//     plugins: [react()],
//     server: {
//       port: 3000,
//       proxy: {
//         "/api": {
//           target: `http://127.0.0.1:5001/${env.VITE_FIREBASE_PROJECT_ID}/us-central1`,
//           changeOrigin: true,
//           rewrite: (path) => path.replace(/^\/api/, "/api"),
//         },
//       },
//     },
//     build: {
//       outDir: "dist",
//       sourcemap: true,
//     },
//   };
// });

// import { defineConfig, loadEnv } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");

//   return {
//     plugins: [react()],
//     server: {
//       port: 3000,
//       proxy: {
//         "/api": {
//           // Target your Firebase project ID
//           target: `http://127.0.0.1:5001/${env.VITE_FIREBASE_PROJECT_ID}/us-central1`,
//           changeOrigin: true,
//           // 🚫 Don't proxy Firebase Auth API calls
//           bypass: (req) => {
//             if (req.headers.authorization?.includes("firebase")) {
//               return req.headers.referer;
//             }
//             // Don't proxy requests to Google's identity toolkit
//             if (req.url?.includes("identitytoolkit.googleapis.com")) {
//               return req.headers.referer;
//             }
//           },
//         },
//       },
//     },
//     build: {
//       outDir: "dist",
//       sourcemap: true,
//     },
//   };
// });
