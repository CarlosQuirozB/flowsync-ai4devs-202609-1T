import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Utilidades para volcar a disco el documento OpenAPI que `@foadonis/openapi`
 * construye en memoria, y para comparar dos versiones del mismo documento.
 *
 * Las usan los comandos `openapi:generate` y `openapi:check`: el primero
 * escribe el fichero versionado, el segundo lo regenera en una ubicación
 * temporal y lo compara con el versionado sin tocarlo.
 */

/**
 * Ruta del documento versionado. Vive en `docs/` de la raíz del repo, no en
 * `backend/`, porque es el contrato de la API y no un artefacto del backend.
 */
export function versionedDocumentPath(app: ApplicationService) {
  return app.makePath('..', 'docs', 'api', 'openapi.json')
}

/**
 * Construye el documento a partir de las rutas registradas y lo serializa de
 * forma estable: indentado a dos espacios y con salto de línea final, para que
 * el diff en git sea legible y el contenido no dependa de quién lo genere.
 */
export async function renderDocument(app: ApplicationService) {
  const router = await app.container.make('router')
  router.commit()

  const openapi = await app.container.make('openapi')
  const document = await openapi.buildDocument()
  return `${JSON.stringify(document, null, 2)}\n`
}

export async function writeDocument(app: ApplicationService, path: string) {
  const content = await renderDocument(app)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content, 'utf-8')
}

export type DocumentDifference =
  | { kind: 'added'; path: string; value: unknown }
  | { kind: 'removed'; path: string; value: unknown }
  | { kind: 'changed'; path: string; expected: unknown; actual: unknown }

/**
 * Compara dos documentos de forma estructural y devuelve cada diferencia con
 * su ruta JSON (`paths./api/v1/tasks.get.summary`), que dice mucho más que un
 * diff de líneas sobre un JSON indentado. `expected` es el versionado y
 * `actual` el regenerado.
 */
export function diffDocuments(expected: unknown, actual: unknown, path = ''): DocumentDifference[] {
  if (isPlainObject(expected) && isPlainObject(actual)) {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)])
    return [...keys].flatMap((key) => {
      const childPath = joinPath(path, key)
      if (!(key in actual)) return [{ kind: 'removed', path: childPath, value: expected[key] }]
      if (!(key in expected)) return [{ kind: 'added', path: childPath, value: actual[key] }]
      return diffDocuments(expected[key], actual[key], childPath)
    })
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    const length = Math.max(expected.length, actual.length)
    return Array.from({ length }, (_, index) => {
      const childPath = `${path}[${index}]`
      if (index >= actual.length) {
        return [{ kind: 'removed' as const, path: childPath, value: expected[index] }]
      }
      if (index >= expected.length) {
        return [{ kind: 'added' as const, path: childPath, value: actual[index] }]
      }
      return diffDocuments(expected[index], actual[index], childPath)
    }).flat()
  }

  if (JSON.stringify(expected) === JSON.stringify(actual)) return []
  return [{ kind: 'changed', path: path || '(raíz)', expected, actual }]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Las claves de `paths` llevan barras (`/api/v1/tasks`), así que las que no
 * son identificadores simples van entre corchetes para que la ruta se lea sin
 * ambigüedad.
 */
function joinPath(parent: string, key: string) {
  const segment = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `[${JSON.stringify(key)}]`
  if (!parent) return segment
  return segment.startsWith('[') ? `${parent}${segment}` : `${parent}.${segment}`
}
