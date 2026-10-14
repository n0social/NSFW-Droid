/** @type {import('next').NextConfig} */
const nextConfig = {
  // PGlite loads WASM via import.meta.url; bundling breaks Node fs path resolution.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
