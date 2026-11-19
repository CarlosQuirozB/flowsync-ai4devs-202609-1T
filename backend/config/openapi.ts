import { defineConfig } from '@foadonis/openapi'

export default defineConfig({
  ui: 'scalar',
  document: {
    info: {
      title: 'FlowSync API',
      // Versión del documento, no del paquete: acompaña al prefijo `/api/v1`
      // de `start/routes.ts`, la única versión de la API que existe hoy.
      version: '1.0.0',
    },
  },
})
