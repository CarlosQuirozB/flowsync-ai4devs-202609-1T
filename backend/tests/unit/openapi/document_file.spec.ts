import { test } from '@japa/runner'
import { diffDocuments } from '#openapi/document_file'

test.group('diffDocuments', () => {
  test('no devuelve diferencias entre documentos iguales', ({ assert }) => {
    const doc = { info: { version: '1.0.0' }, paths: { '/api/v1/tasks': { get: {} } } }
    assert.deepEqual(diffDocuments(doc, structuredClone(doc)), [])
  })

  test('reporta claves añadidas, quitadas y cambiadas con su ruta', ({ assert }) => {
    const versioned = { info: { version: '0.9.0' }, extra: true, paths: {} }
    const generated = { info: { version: '1.0.0' }, paths: { '/api/v1/tasks': { get: {} } } }

    assert.sameDeepMembers(diffDocuments(versioned, generated), [
      { kind: 'changed', path: 'info.version', expected: '0.9.0', actual: '1.0.0' },
      { kind: 'removed', path: 'extra', value: true },
      { kind: 'added', path: 'paths["/api/v1/tasks"]', value: { get: {} } },
    ])
  })

  test('compara arrays por posición', ({ assert }) => {
    assert.deepEqual(diffDocuments({ tags: ['a', 'b'] }, { tags: ['a', 'c', 'd'] }), [
      { kind: 'changed', path: 'tags[1]', expected: 'b', actual: 'c' },
      { kind: 'added', path: 'tags[2]', value: 'd' },
    ])
  })

  test('no confunde claves con propiedades heredadas del prototipo', ({ assert }) => {
    assert.deepEqual(diffDocuments({}, { constructor: 1 }), [
      { kind: 'added', path: 'constructor', value: 1 },
    ])
  })
})
