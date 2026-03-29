import { expectTypeOf } from 'expect-type';
import { command, event, query, defineRegistry } from '../define-helpers';
import type { Command } from '../command';
import type { Event } from '../event';
import type { Query } from '../query';
import type {
  PayloadOf,
  ResponseOf,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
} from '../utility-types';

describe('command()', () => {
  it('returns Command type with given payload and response', () => {
    const c = command<{ name: string }, { id: string }>();
    expectTypeOf(c).toMatchTypeOf<Command<string, { name: string }, { id: string }>>();
  });

  it('defaults payload to void and response to void', () => {
    const c = command();
    expectTypeOf(c).toMatchTypeOf<Command<string, void, void>>();
  });
});

describe('event()', () => {
  it('returns Event type with given payload', () => {
    const e = event<{ userId: string }>();
    expectTypeOf(e).toMatchTypeOf<Event<string, { userId: string }>>();
  });

  it('defaults payload to void', () => {
    const e = event();
    expectTypeOf(e).toMatchTypeOf<Event<string, void>>();
  });
});

describe('query()', () => {
  it('returns Query type with given payload and response', () => {
    const q = query<{ id: string }, { name: string }>();
    expectTypeOf(q).toMatchTypeOf<Query<string, { id: string }, { name: string }>>();
  });
});

describe('defineRegistry()', () => {
  const registry = defineRegistry({
    'user.create': command<{ name: string }, { id: string }>(),
    'user.created': event<{ userId: string }>(),
    'user.get': query<{ id: string }, { name: string }>(),
  });

  it('infers pattern keys from object keys', () => {
    expectTypeOf<CommandPatterns<typeof registry>>().toEqualTypeOf<'user.create'>();
    expectTypeOf<EventPatterns<typeof registry>>().toEqualTypeOf<'user.created'>();
    expectTypeOf<QueryPatterns<typeof registry>>().toEqualTypeOf<'user.get'>();
  });

  it('preserves payload types', () => {
    expectTypeOf<PayloadOf<(typeof registry)['user.create']>>().toEqualTypeOf<{ name: string }>();
    expectTypeOf<PayloadOf<(typeof registry)['user.created']>>().toEqualTypeOf<{
      userId: string;
    }>();
    expectTypeOf<PayloadOf<(typeof registry)['user.get']>>().toEqualTypeOf<{ id: string }>();
  });

  it('preserves response types', () => {
    expectTypeOf<ResponseOf<(typeof registry)['user.create']>>().toEqualTypeOf<{ id: string }>();
    expectTypeOf<ResponseOf<(typeof registry)['user.get']>>().toEqualTypeOf<{ name: string }>();
  });
});
