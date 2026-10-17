import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`.
 *
 * Una tarea se «obtiene» por dos caminos: suelta (`GET /tasks/:id`) y dentro de
 * la lista (`GET /tasks`). Cada scenario se comprueba por los dos, porque el
 * requisito no distingue y cada camino tiene su propio transformer.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /**
   * Lo único que el requisito deja salir del responsable: algo con lo que
   * referirse a él, su nombre y sus iniciales. Cualquier otro dato de la cuenta
   * —email, contraseña, fechas de la cuenta— sobra.
   */
  const CAMPOS_DEL_RESPONSABLE = ['id', 'fullName', 'initials']

  async function sesion(client: any, email = 'mirona@example.com') {
    await User.create({ fullName: 'Grace Hopper', email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function tareaDe(responsable: User) {
    return Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: responsable.id,
    })
  }

  async function suelta(client: any, token: string, task: Task) {
    const response = await client
      .get(`/api/v1/tasks/${task.id}`)
      .qs({ today: '2026-08-13' })
      .header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    return response.body().data
  }

  async function enLaLista(client: any, token: string, task: Task, assert: any) {
    const response = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const fila = response.body().data.find((t: { id: number }) => t.id === task.id)
    assert.exists(fila, 'la tarea no aparece en la lista')
    return fila
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const token = await sesion(client)
    const ada = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })
    const task = await tareaDe(ada)

    for (const tarea of [
      await suelta(client, token, task),
      await enLaLista(client, token, task, assert),
    ]) {
      assert.equal(tarea.assignee.fullName, 'Ada Lovelace')
      assert.equal(tarea.assignee.initials, 'AL')
    }
  })

  test('la tarea no filtra el email ni otros datos de la cuenta', async ({ client, assert }) => {
    const token = await sesion(client)
    const ada = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })
    const task = await tareaDe(ada)

    for (const [camino, tarea] of [
      ['suelta', await suelta(client, token, task)],
      ['en la lista', await enLaLista(client, token, task, assert)],
    ]) {
      assert.notProperty(tarea.assignee, 'email', `la tarea ${camino} expone el email`)
      assert.notProperty(tarea.assignee, 'password', `la tarea ${camino} expone la contraseña`)
      assert.sameMembers(
        Object.keys(tarea.assignee),
        CAMPOS_DEL_RESPONSABLE,
        `la tarea ${camino} expone más datos del responsable de los necesarios`
      )
    }
  })

  test('un responsable sin nombre llega con el nombre nulo y sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const sinNombre = await User.create({
      fullName: null,
      email: 'ada@example.com',
      password: 'secreto123',
    })
    const task = await tareaDe(sinNombre)

    for (const [camino, tarea] of [
      ['suelta', await suelta(client, token, task)],
      ['en la lista', await enLaLista(client, token, task, assert)],
    ]) {
      assert.isNull(tarea.assignee.fullName)
      assert.equal(tarea.assignee.initials, 'AE')
      // Las iniciales salen del email, pero el email en sí no puede viajar con
      // ellas: es justo lo que el scenario quiere evitar.
      assert.notProperty(tarea.assignee, 'email', `la tarea ${camino} expone el email`)
    }
  })
})
