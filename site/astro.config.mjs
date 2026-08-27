import { defineConfig } from "astro/config";

// Sitio de proyecto en GitHub Pages: https://factura-facil.github.io/estandar-fe-retail-fer
// Al mover a dominio propio: site = "https://midominio.org", base = "/".
export default defineConfig({
  site: "https://factura-facil.github.io",
  base: "/estandar-fe-retail-fer",
  trailingSlash: "always",
  markdown: {
    shikiConfig: { theme: "github-light", wrap: true },
  },
  build: { format: "directory" },
});
