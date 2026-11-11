import type { errors as enErrors } from '../en/errors'

export const errors = {
  network: 'Error de red. Revisá tu conexión e intentá de nuevo.',
  timeout: 'La solicitud tardó demasiado. Intentá de nuevo.',
  unexpected: 'Algo salió mal. Intentá de nuevo.',
  server: 'El servidor devolvió un error.',
  notFound: 'No encontrado.',
} satisfies typeof enErrors
