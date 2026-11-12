import type { search as enSearch } from '../en/search'

export const search = {
  input: {
    label: 'Buscar por ticker',
    placeholder: 'ej. DYCA',
    clear: 'Limpiar búsqueda',
  },
  results_one: '{{count}} resultado para “{{query}}”',
  results_other: '{{count}} resultados para “{{query}}”',
  empty: {
    title: 'No se encontraron instrumentos',
    description: 'No hay resultados para “{{query}}”. Probá con otro ticker.',
  },
} satisfies typeof enSearch
