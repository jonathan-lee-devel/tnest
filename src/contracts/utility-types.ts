import type { HttpStatus } from '@nestjs/common';

import type { Command } from './command';
import type { Event } from './event';
import type { Query } from './query';

export interface HttpResponse<T> {
  status: HttpStatus;
  data: T;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- `any` is required in conditional/mapped type positions to match all instantiations */

export type AnyContract = Command<string, any, any> | Event<string, any> | Query<string, any, any>;

export type PatternOf<C extends AnyContract> = C['pattern'];

export type PayloadOf<C extends AnyContract> = C['payload'];

export type ResponseOf<C extends AnyContract> =
  C extends Command<any, any, infer R>
    ? R
    : C extends Query<any, any, infer R>
      ? R
      : C extends Event
        ? undefined
        : never;

export type ContractRegistry = Record<string, AnyContract>;

export type CommandsOf<TRegistry extends ContractRegistry> = {
  [K in keyof TRegistry as TRegistry[K] extends Command<any, any, any> ? K : never]: TRegistry[K];
};

export type EventsOf<TRegistry extends ContractRegistry> = {
  [K in keyof TRegistry as TRegistry[K] extends Event<any, any> ? K : never]: TRegistry[K];
};

export type QueriesOf<TRegistry extends ContractRegistry> = {
  [K in keyof TRegistry as TRegistry[K] extends Query<any, any, any> ? K : never]: TRegistry[K];
};

/* eslint-enable @typescript-eslint/no-explicit-any */

export type CommandPatterns<TRegistry extends ContractRegistry> = keyof CommandsOf<TRegistry> &
  string;

export type EventPatterns<TRegistry extends ContractRegistry> = keyof EventsOf<TRegistry> & string;

export type QueryPatterns<TRegistry extends ContractRegistry> = keyof QueriesOf<TRegistry> & string;

export type SendablePatterns<TRegistry extends ContractRegistry> =
  | CommandPatterns<TRegistry>
  | QueryPatterns<TRegistry>;
