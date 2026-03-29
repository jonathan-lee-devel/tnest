import type { ContractRegistry } from './utility-types';

export type ValidateRegistry<TRegistry extends ContractRegistry> = {
  [K in keyof TRegistry]: TRegistry[K] extends { pattern: infer P }
    ? P extends K
      ? TRegistry[K]
      : { error: `Pattern '${P & string}' does not match registry key '${K & string}'` }
    : never;
};