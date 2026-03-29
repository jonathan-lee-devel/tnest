import { expectTypeOf } from 'expect-type';
import type { TypedMessageHandler, TypedEventHandler } from '../handler-types';
import type { Command } from '../../contracts/command';
import type { Event } from '../../contracts/event';
import type { Query } from '../../contracts/query';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'user.create': Command<'user.create', { name: string }, { id: string }>;
  'user.created': Event<'user.created', { userId: string }>;
  'user.get': Query<'user.get', { id: string }, { name: string }>;
}

describe('TypedMessageHandler', () => {
  it('accepts payload and returns response for command', () => {
    type Handler = TypedMessageHandler<TestRegistry, 'user.create'>;
    expectTypeOf<Parameters<Handler>>().toEqualTypeOf<[{ name: string }]>();
  });

  it('accepts payload and returns response for query', () => {
    type Handler = TypedMessageHandler<TestRegistry, 'user.get'>;
    expectTypeOf<Parameters<Handler>>().toEqualTypeOf<[{ id: string }]>();
  });
});

describe('TypedEventHandler', () => {
  it('accepts payload and returns void', () => {
    type Handler = TypedEventHandler<TestRegistry, 'user.created'>;
    expectTypeOf<Parameters<Handler>>().toEqualTypeOf<[{ userId: string }]>();
  });
});
