export const TNEST_OPTIONS = Symbol('TNEST_OPTIONS');
export const TNEST_CLIENT_PREFIX = 'TNEST_CLIENT_';

export function getClientToken(name: string | symbol): string {
  // Symbols can't be interpolated into a template literal (it throws), so
  // coerce explicitly. `String(Symbol('X'))` yields a stable `"Symbol(X)"`,
  // keeping the derived token deterministic for a given name.
  return `${TNEST_CLIENT_PREFIX}${String(name)}`;
}
