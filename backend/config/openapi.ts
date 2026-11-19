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
    components: {
      securitySchemes: {
        // El nombre `bearer` lo fija `@ApiBearerAuth()`: es la clave que esa
        // anotación referencia desde cada operación protegida.
        bearer: {
          type: 'http',
          scheme: 'bearer',
          description:
            'Access token opaco de `POST /api/v1/auth/login`, en `Authorization: Bearer <token>`.',
        },
      },
    },
  },
})
