// Minimal Vite env typing for this library's own build. Consuming Vite apps
// type `import.meta.env` with `vite/client` instead (this file is not imported).
interface ImportMeta {
  readonly env: { readonly BASE_URL: string };
}
