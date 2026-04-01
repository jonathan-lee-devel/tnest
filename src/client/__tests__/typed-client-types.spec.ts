import { expectTypeOf } from 'expect-type';
import type { Observable } from 'rxjs';
import type { TypedClient } from '../typed-client';
import type { Command } from '../../contracts/command';
import type { Event } from '../../contracts/event';
import type { Query } from '../../contracts/query';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'user.create': Command<'user.create', { name: string }, { id: string }>;
  'user.created': Event<'user.created', { userId: string }>;
  'user.get': Query<'user.get', { id: string }, { name: string }>;
}

type Client = TypedClient<TestRegistry>;

describe('TypedClient type constraints', () => {
  it('send() returns Observable of correct response type for command', () => {
    expectTypeOf<Client['send']>().parameter(0).toExtend<'user.create' | 'user.get'>();
  });

  it('send() infers response type from pattern', () => {
    type SendReturn = ReturnType<Client['send']>;
    expectTypeOf<SendReturn>().toExtend<Observable<unknown>>();
  });

  it('emit() accepts only event patterns', () => {
    expectTypeOf<Client['emit']>().parameter(0).toEqualTypeOf<'user.created'>();
  });

  it('emit() returns Observable<undefined>', () => {
    type EmitReturn = ReturnType<Client['emit']>;
    expectTypeOf<EmitReturn>().toEqualTypeOf<Observable<undefined>>();
  });
});
