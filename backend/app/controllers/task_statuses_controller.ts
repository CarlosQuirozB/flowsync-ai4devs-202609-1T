import Task from '#models/task'
import { updateTaskStatusValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import {
  ErrorResponse,
  NotFoundResponse,
  TaskResponse,
  UpdateTaskStatusBody,
  ValidationErrorResponse,
} from '#openapi/schemas'

@ApiBearerAuth()
export default class TaskStatusesController {
  /**
   * El estado es lo único mutable de una tarea en este momento, y por eso
   * tiene endpoint propio en vez de colgar de un update genérico: por ese
   * update acabarían colándose el título y el responsable, que son historias
   * que todavía no se han especificado.
   *
   * Cualquier persona con sesión puede cambiar el estado de cualquier tarea,
   * en cualquier dirección. No hay permisos por responsable ni transiciones
   * prohibidas: volver de «hecho» a «pendiente» es justamente lo que arregla
   * un clic dado por error.
   */
  @ApiOperation({
    summary: 'Cambiar el estado de una tarea',
    description:
      'Cualquier cuenta con sesión, sobre cualquier tarea y en cualquier dirección. No toca ni el título ni el responsable.',
  })
  @ApiBody({ type: () => UpdateTaskStatusBody })
  @ApiResponse({
    status: 200,
    description: 'La tarea ya en el estado pedido.',
    type: () => TaskResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Falta el token o no es válido. Nada cambia.',
    type: () => ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description: 'No existe ninguna tarea con ese identificador. Se comprueba antes que el cuerpo.',
    type: () => NotFoundResponse,
  })
  @ApiResponse({
    status: 422,
    description: '`status` falta o no es uno de los tres. La tarea conserva el que tenía.',
    type: () => ValidationErrorResponse,
  })
  async update({ params, request, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    const { status } = await request.validateUsing(updateTaskStatusValidator)

    task.status = status
    await task.save()
    await task.load('assignee')

    return serialize(TaskTransformer.transform(task))
  }
}
