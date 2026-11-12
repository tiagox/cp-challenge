import type { common as enCommon } from '../en/common'

export const common = {
  appName: 'CP Invest',
  loading: 'Cargando...',
  retry: 'Reintentar',
  close: 'Cerrar',
  cancel: 'Cancelar',
  back: 'Volver',
  notAvailable: '—',
  unexpectedErrorTitle: 'Algo salió mal',
  unexpectedErrorDescription: 'Intentá de nuevo.',
  notFoundTitle: 'Página no encontrada',
  notFoundDescription: 'La página que buscás no existe.',
  goToInstruments: 'Ir a instrumentos',
  refresh: 'Actualizar',
  debug: {
    open: 'Herramientas de depuración',
    title: 'Depuración',
    newCandidate: 'Nuevo ID',
    apply: 'Aplicar',
    candidateFromEnv: 'Definido por VITE_CANDIDATE_ID; no se puede cambiar acá.',
    turnOff: 'Desactivar depuración',
  },
} satisfies typeof enCommon
