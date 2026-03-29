export const TNEST_OPTIONS = Symbol('TNEST_OPTIONS');
export const TNEST_CLIENT_PREFIX = 'TNEST_CLIENT_';

export function getClientToken(name: string): string {
  return `${TNEST_CLIENT_PREFIX}${name}`;
}
