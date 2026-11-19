import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * El responsable dentro de cada tarea. Cubre los tres scenarios del requisito
 * «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable se identifica por nombre e
 * iniciales, la tarea no arrastra ningún otro dato de su cuenta, y una cuenta
 * sin nombre sigue llegando con iniciales.
 *
 * Cada test mira las dos lecturas que devuelven tareas, la lista y la tarea
 * suelta, porque el requisito no distingue entre ellas.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function sesion(client: any, email = 'ada@example.com') {
    await User.create({ fullName: 'Ada Lovelace', email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function responsables(client: any, token: string, task: Task) {
    const lista = await client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
    lista.assertStatus(200)

    const suelta = await client
      .get(`/api/v1/tasks/${task.id}`)
      .qs({ today: '2026-08-13' })
      .header('Authorization', `Bearer ${token}`)
    suelta.assertStatus(200)

    const enLista = lista.body().data.find((t: { id: number }) => t.id === task.id)

    return { enLista: enLista.assignee, suelta: suelta.body().data.assignee }
  }

  test('el responsable llega con su nombre y sus iniciales', async ({ client, assert }) => {
    const token = await sesion(client)
    const ada = await User.findByOrFail('email', 'ada@example.com')
    const task = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: ada.id,
    })

    const { enLista, suelta } = await responsables(client, token, task)

    for (const assignee of [enLista, suelta]) {
      assert.equal(assignee.fullName, 'Ada Lovelace')
      assert.equal(assignee.initials, 'AL')
    }
  })

  test('la tarea no trae el email ni ningún otro dato de la cuenta', async ({ client, assert }) => {
    const token = await sesion(client)
    const alan = await User.create({
      fullName: 'Alan Turing',
      email: 'alan@example.com',
      password: 'secreto123',
    })
    const task = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: alan.id,
    })

    const { enLista, suelta } = await responsables(client, token, task)

    for (const assignee of [enLista, suelta]) {
      assert.notProperty(assignee, 'email')
      assert.notProperty(assignee, 'password')
      assert.sameMembers(Object.keys(assignee), ['id', 'fullName', 'initials'])
    }
  })

  test('un responsable sin nombre llega con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client)
    const anonimo = await User.create({
      fullName: null,
      email: 'grace@example.com',
      password: 'secreto123',
    })
    const task = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: anonimo.id,
    })

    const { enLista, suelta } = await responsables(client, token, task)

    for (const assignee of [enLista, suelta]) {
      assert.isNull(assignee.fullName)
      assert.equal(assignee.initials, 'GE')
    }
  })
})
