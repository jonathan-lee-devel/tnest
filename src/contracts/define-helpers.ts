import type { Command } from './command';
import type { Event } from './event';
import type { Query } from './query';
import type { ContractRegistry } from './utility-types';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return -- zero-overhead type helpers; runtime value is irrelevant */

export function command<TPayload = void, TResponse = void>(): Command<string, TPayload, TResponse> {
  return undefined as any;
}

export function event<TPayload = void>(): Event<string, TPayload> {
  return undefined as any;
}

export function query<TPayload = void, TResponse = unknown>(): Query<string, TPayload, TResponse> {
  return undefined as any;
}

type InferRegistry<T extends Record<string, any>> = {
  [K in keyof T & string]: T[K] extends Command<any, infer P, infer R>
    ? Command<K, P, R>
    : T[K] extends Event<any, infer P>
      ? Event<K, P>
      : T[K] extends Query<any, infer P, infer R>
        ? Query<K, P, R>
        : never;
};

export function defineRegistry<T extends Record<string, any>>(
  contracts: T,
): InferRegistry<T> & ContractRegistry {
  return contracts as any;
}

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return */
