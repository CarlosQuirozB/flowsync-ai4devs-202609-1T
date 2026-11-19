import { ApiProperty } from '@foadonis/openapi/decorators'
import { TASK_STATUSES } from '#models/task'

/**
 * Esquemas del documento OpenAPI que se repiten entre operaciones.
 *
 * Cada clase se publica en `components.schemas` con su nombre, y las respuestas
 * y cuerpos la referencian con `$ref`: la forma de un objeto se describe una
 * sola vez. Nunca se instancian; solo existen para que `@foadonis/openapi` lea
 * sus `@ApiProperty` al construir el documento.
 *
 * El tipo de cada propiedad va siempre explícito, porque `design:type` no
 * distingue `string | null` de `string` ni conoce formatos, y aquí la
 * nulabilidad (`fullName`, `dueDate`) es justo lo que hay que contar.
 *
 * Esto documenta, no valida: refleja lo que hoy devuelven los transformers de
 * `app/transformers/` y lo que aceptan los validadores de `app/validators/task.ts`.
 * Si cambia uno de ellos, este fichero cambia en el mismo commit.
 */

/** `TaskAssigneeTransformer`: lo justo para identificar al responsable, sin email. */
export class TaskAssignee {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number

  @ApiProperty({
    type: 'string',
    nullable: true,
    example: 'Ada Lovelace',
    description: 'Nulo si la cuenta se registró sin nombre; las iniciales llegan igual.',
  })
  fullName!: string | null

  @ApiProperty({ type: 'string', example: 'AL' })
  initials!: string
}

/**
 * `TaskTransformer`: la tarea de la lista, de la creación y del cambio de
 * estado. No lleva `dueDate` ni `isOverdue`, y esa ausencia es parte del
 * contrato: la lista no informa del vencimiento.
 */
export class Task {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number

  @ApiProperty({ type: 'string', maxLength: 200, example: 'Revisar el informe' })
  title!: string

  @ApiProperty({ type: 'string', enum: [...TASK_STATUSES], example: 'pending' })
  status!: string

  @ApiProperty({ type: () => TaskAssignee })
  assignee!: TaskAssignee

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: string
}

/**
 * `TaskDetailTransformer`: la tarea con su vencimiento. La devuelven la
 * consulta suelta y el cambio de fecha. Se escribe entera, sin `extends Task`,
 * igual que el transformer no extiende al de la lista: son dos formas
 * distintas a propósito.
 */
export class TaskDetail {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number

  @ApiProperty({ type: 'string', maxLength: 200, example: 'Revisar el informe' })
  title!: string

  @ApiProperty({ type: 'string', enum: [...TASK_STATUSES], example: 'pending' })
  status!: string

  @ApiProperty({
    type: 'string',
    format: 'date',
    nullable: true,
    example: '2026-09-30',
    description:
      'Día del calendario `AAAA-MM-DD`, sin hora ni huso. Nulo si la tarea no tiene fecha.',
  })
  dueDate!: string | null

  @ApiProperty({
    type: 'boolean',
    description:
      'Resuelto contra el `today` de la petición: tiene fecha, es anterior a ese día y el estado no es `done`.',
  })
  isOverdue!: boolean

  @ApiProperty({ type: () => TaskAssignee })
  assignee!: TaskAssignee

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: string
}

/* Envoltorios `{ data }` que añade `serialize()` (providers/api_provider.ts). */

export class TaskResponse {
  @ApiProperty({ type: () => Task })
  data!: Task
}

export class TaskListResponse {
  @ApiProperty({ type: () => [Task] })
  data!: Task[]
}

export class TaskDetailResponse {
  @ApiProperty({ type: () => TaskDetail })
  data!: TaskDetail
}

/* Cuerpos de petición (`createTaskValidator`, `updateTaskStatusValidator`, `setTaskDueDateValidator`). */

export class CreateTaskBody {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 200,
    example: 'Revisar el informe',
    description:
      'Se recortan los espacios de los extremos antes de medir: solo espacios cuenta como vacío, y más de 200 caracteres es un `422`, nunca un recorte.',
  })
  title!: string
}

export class UpdateTaskStatusBody {
  @ApiProperty({
    type: 'string',
    enum: [...TASK_STATUSES],
    example: 'in_progress',
    description: 'Cualquiera de los tres; toda transición vale, incluida la vuelta desde `done`.',
  })
  status!: string
}

export class SetTaskDueDateBody {
  @ApiProperty({
    type: 'string',
    format: 'date',
    nullable: true,
    example: '2026-09-30',
    description: '`AAAA-MM-DD`, o `null` para retirar la fecha (que no es un error).',
  })
  dueDate!: string | null

  @ApiProperty({
    type: 'string',
    format: 'date',
    example: '2026-08-27',
    description:
      'Día de referencia `AAAA-MM-DD` contra el que se resuelve `isOverdue` en la respuesta. Obligatorio, sin valor por defecto.',
  })
  today!: string
}

/* Errores. No comparten forma: el `401` y el `422` llegan como `{ errors: [...] }`, el `404` no. */

/** Un error de VineJS sobre un campo concreto. */
export class ValidationErrorItem {
  @ApiProperty({ type: 'string', example: 'The title field must be defined' })
  message!: string

  @ApiProperty({ type: 'string', example: 'required' })
  rule!: string

  @ApiProperty({ type: 'string', example: 'title' })
  field!: string
}

export class ValidationErrorResponse {
  @ApiProperty({ type: () => [ValidationErrorItem] })
  errors!: ValidationErrorItem[]
}

/** El `401` de auth: sin campo, solo el mensaje. */
export class ErrorItem {
  @ApiProperty({ type: 'string', example: 'Unauthorized access' })
  message!: string
}

export class ErrorResponse {
  @ApiProperty({ type: () => [ErrorItem] })
  errors!: ErrorItem[]
}

/**
 * El `404` de `findOrFail` (`E_ROW_NOT_FOUND`), tal como lo pinta el
 * `ExceptionHandler` de Adonis sin depuración: `{ message }`, sin envoltorio
 * `errors`. Con `debug` activo (todo entorno que no sea producción, según
 * `app/exceptions/handler.ts`) el cuerpo es en cambio el volcado de Youch, con
 * la traza; esa forma no se documenta porque no es contrato.
 */
export class NotFoundResponse {
  @ApiProperty({ type: 'string', example: 'Row not found' })
  message!: string
}
