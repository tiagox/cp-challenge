export const queryKeys = {
  instruments: ['instruments'] as const,
  portfolio: ['portfolio'] as const,
  orders: ['orders'] as const,
  search: (query: string) => ['search', query] as const,
}
