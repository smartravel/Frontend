export function getRedirectPath(state: unknown) {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') {
    return state.from
  }
  return '/'
}
