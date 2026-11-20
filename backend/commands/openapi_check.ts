import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import {
  diffDocuments,
  versionedDocumentPath,
  writeDocument,
  type DocumentDifference,
} from '#openapi/document_file'

/**
 * Comprueba que `docs/api/openapi.json` está al día: regenera el documento en
 * un directorio temporal, lo compara con el versionado y termina con código
 * distinto de cero explicando cada diferencia. Solo compara: nunca escribe el
 * fichero versionado. Para arreglarlo, `npm run openapi:generate`.
 */
export default class OpenapiCheck extends BaseCommand {
  static commandName = 'openapi:check'
  static description =
    'Comprueba que docs/api/openapi.json coincide con el documento OpenAPI que generan las rutas'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const versionedPath = versionedDocumentPath(this.app)
    const displayPath = relative(process.cwd(), versionedPath)

    const versioned = await readFile(versionedPath, 'utf-8').catch((error) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })
    if (versioned === undefined) {
      this.fail(`No existe ${displayPath}. Genéralo con \`npm run openapi:generate\`.`)
      return
    }

    const tmpDir = await mkdtemp(join(tmpdir(), 'flowsync-openapi-'))
    let regenerated: string
    try {
      const tmpPath = join(tmpDir, 'openapi.json')
      await writeDocument(this.app, tmpPath)
      regenerated = await readFile(tmpPath, 'utf-8')
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }

    if (versioned === regenerated) {
      this.logger.success(`${displayPath} está al día`)
      return
    }

    let differences: DocumentDifference[]
    try {
      differences = diffDocuments(JSON.parse(versioned), JSON.parse(regenerated))
    } catch {
      this.fail(`${displayPath} no es un JSON válido. Regenéralo con \`npm run openapi:generate\`.`)
      return
    }

    if (differences.length === 0) {
      // Mismo contenido, distinto formato (indentación, orden de claves, salto final).
      this.fail(
        `${displayPath} tiene el mismo contenido que el documento generado pero no su formato. ` +
          'Regenéralo con `npm run openapi:generate`.'
      )
      return
    }

    this.fail(
      `${displayPath} no coincide con el documento que generan las rutas ` +
        `(${differences.length} diferencia${differences.length === 1 ? '' : 's'}):`,
      differences.map((difference) => this.describe(difference))
    )
  }

  private describe(difference: DocumentDifference) {
    switch (difference.kind) {
      case 'added':
        return `+ ${difference.path}: falta en el versionado (generado: ${preview(difference.value)})`
      case 'removed':
        return `- ${difference.path}: sobra en el versionado (versionado: ${preview(difference.value)})`
      case 'changed':
        return (
          `~ ${difference.path}: versionado ${preview(difference.expected)}, ` +
          `generado ${preview(difference.actual)}`
        )
    }
  }

  private fail(message: string, details: string[] = []) {
    this.logger.error(message)
    for (const line of details) this.logger.log(`  ${line}`)
    if (details.length > 0) {
      this.logger.log('')
      this.logger.log(
        'Si el cambio de contrato es intencionado, regenera con `npm run openapi:generate`.'
      )
    }
    this.exitCode = 1
  }
}

function preview(value: unknown) {
  const text = JSON.stringify(value)
  return text.length > 120 ? `${text.slice(0, 117)}...` : text
}
