import { TASK_STATUSES } from '#models/task'
import { ApiProperty, ApiResponse } from '@foadonis/openapi/decorators'

/**
 * Los esquemas que el documento OpenAPI describe una vez y cada operación
 * referencia. El nombre de la clase es el nombre en `components.schemas`.
 *
 * Solo describen lo que el código ya hace: la forma sale de los transformers de
 * `app/transformers/` y de los validadores de `app/validators/task.ts`.
 */

/** `TaskAssigneeTransformer`: lo justo para identificar al responsable, sin email. */
export class TaskAssignee {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string', nullable: true })
  declare fullName: string | null

  @ApiProperty({ type: 'string' })
  declare initials: string
}

/** `TaskTransformer`: la tarea tal y como la devuelven la lista y las escrituras de estado y alta. */
export class TaskItem {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string' })
  declare title: string

  @ApiProperty({ enum: [...TASK_STATUSES] })
  declare status: (typeof TASK_STATUSES)[number]

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  declare updatedAt: string | null

  @ApiProperty({ type: () => TaskAssignee })
  declare assignee: TaskAssignee
}

/**
 * `TaskDetailTransformer`: la tarea con su vencimiento. Es otro esquema y no
 * `TaskItem` con campos opcionales porque la lista NO puede llevar `dueDate` ni
 * `isOverdue`.
 */
export class TaskDetail {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string' })
  declare title: string

  @ApiProperty({ enum: [...TASK_STATUSES] })
  declare status: (typeof TASK_STATUSES)[number]

  @ApiProperty({
    type: 'string',
    format: 'date',
    nullable: true,
    description: 'Día del calendario `AAAA-MM-DD`, sin hora ni huso. `null` si no tiene fecha.',
  })
  declare dueDate: string | null

  @ApiProperty({
    type: 'boolean',
    description:
      'Vencida si tiene fecha, la fecha es anterior al `today` de la petición y no está en `done`.',
  })
  declare isOverdue: boolean

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  declare updatedAt: string | null

  @ApiProperty({ type: () => TaskAssignee })
  declare assignee: TaskAssignee
}

/** Todo lo que sale por `serialize()` va envuelto en `{ data }`. */
export class TaskResponse {
  @ApiProperty({ type: () => TaskItem })
  declare data: TaskItem
}

export class TaskListResponse {
  @ApiProperty({ type: () => [TaskItem] })
  declare data: TaskItem[]
}

export class TaskDetailResponse {
  @ApiProperty({ type: () => TaskDetail })
  declare data: TaskDetail
}

/** Cuerpo de `createTaskValidator`: solo el título; cualquier otro campo se ignora. */
export class CreateTaskBody {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 200,
    description: 'Se recortan los espacios de los extremos antes de comprobar la longitud.',
  })
  declare title: string
}

/** Cuerpo de `updateTaskStatusValidator`. */
export class UpdateTaskStatusBody {
  @ApiProperty({ enum: [...TASK_STATUSES] })
  declare status: (typeof TASK_STATUSES)[number]
}

/** Cuerpo de `setTaskDueDateValidator`. */
export class SetTaskDueDateBody {
  @ApiProperty({
    type: 'string',
    format: 'date',
    nullable: true,
    description: 'Día `AAAA-MM-DD`, o `null` para retirar la fecha.',
  })
  declare dueDate: string | null

  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Día de referencia de quien pide, `AAAA-MM-DD`. Obligatorio.',
  })
  declare today: string
}

/** Un error de VineJS, tal y como lo lee `frontend/src/lib/api.ts`. */
export class ValidationError {
  @ApiProperty({ type: 'string' })
  declare message: string

  @ApiProperty({ type: 'string' })
  declare rule: string

  @ApiProperty({ type: 'string' })
  declare field: string
}

export class ValidationErrorResponse {
  @ApiProperty({ type: () => [ValidationError] })
  declare errors: ValidationError[]
}

/**
 * Respuestas que se repiten en varias operaciones. Son decoradores ya
 * aplicados, así que se usan tal cual: `@unauthorized`.
 */
export const unauthorized = ApiResponse({
  status: 401,
  description: 'Falta el token de acceso o no es válido.',
})

export const notFound = ApiResponse({
  status: 404,
  description: 'La tarea no existe.',
})

export const invalid = ApiResponse({
  status: 422,
  description: 'La petición no pasa la validación; el error señala el campo.',
  type: ValidationErrorResponse,
})
