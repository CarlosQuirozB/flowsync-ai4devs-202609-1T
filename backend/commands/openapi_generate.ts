import { relative } from 'node:path'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { versionedDocumentPath, writeDocument } from '#openapi/document_file'

/**
 * Genera el documento OpenAPI a partir de las rutas y controladores actuales y
 * lo escribe en `docs/api/openapi.json`, el fichero versionado del contrato.
 */
export default class OpenapiGenerate extends BaseCommand {
  static commandName = 'openapi:generate'
  static description = 'Genera el documento OpenAPI y lo escribe en docs/api/openapi.json'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const path = versionedDocumentPath(this.app)
    await writeDocument(this.app, path)
    this.logger.success(`Documento OpenAPI escrito en ${relative(process.cwd(), path)}`)
  }
}
