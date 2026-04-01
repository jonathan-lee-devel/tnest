import { expectTypeOf } from 'expect-type';
import type { Command } from '../command';
import type { Event } from '../event';
import type { Query } from '../query';
import type {
  AnyContract,
  PatternOf,
  PayloadOf,
  ResponseOf,
  ContractRegistry,
  CommandsOf,
  EventsOf,
  QueriesOf,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
  SendablePatterns,
} from '../utility-types';
import type { ValidateRegistry } from '../registry';

// --- Test fixtures ---

interface CreateUserDto {
  name: string;
  email: string;
}
interface User {
  id: string;
  name: string;
  email: string;
}
interface UserCreatedPayload {
  userId: string;
}

interface TestRegistry extends ContractRegistry {
  'user.create': Command<'user.create', CreateUserDto, User>;
  'user.created': Event<'user.created', UserCreatedPayload>;
  'user.get': Query<'user.get', { id: string }, User>;
}

// --- Tests ---

describe('Contract type branding', () => {
  it('Command has __type "command"', () => {
    expectTypeOf<Command<'test', string, number>>().toHaveProperty('__type');
    expectTypeOf<Command<'test', string, number>['__type']>().toEqualTypeOf<'command'>();
  });

  it('Event has __type "event"', () => {
    expectTypeOf<Event<'test', string>>().toHaveProperty('__type');
    expectTypeOf<Event<'test', string>['__type']>().toEqualTypeOf<'event'>();
  });

  it('Query has __type "query"', () => {
    expectTypeOf<Query<'test', string, number>>().toHaveProperty('__type');
    expectTypeOf<Query<'test', string, number>['__type']>().toEqualTypeOf<'query'>();
  });

  it('Command carries pattern, payload, and response', () => {
    type C = Command<'foo', string, number>;
    expectTypeOf<C['pattern']>().toEqualTypeOf<'foo'>();
    expectTypeOf<C['payload']>().toEqualTypeOf<string>();
    expectTypeOf<C['response']>().toEqualTypeOf<number>();
  });

  it('Event carries pattern and payload', () => {
    type E = Event<'bar', string>;
    expectTypeOf<E['pattern']>().toEqualTypeOf<'bar'>();
    expectTypeOf<E['payload']>().toEqualTypeOf<string>();
  });

  it('Query carries pattern, payload, and response', () => {
    type Q = Query<'baz', string, number>;
    expectTypeOf<Q['pattern']>().toEqualTypeOf<'baz'>();
    expectTypeOf<Q['payload']>().toEqualTypeOf<string>();
    expectTypeOf<Q['response']>().toEqualTypeOf<number>();
  });
});

describe('Utility types', () => {
  it('PatternOf extracts pattern from any contract', () => {
    expectTypeOf<PatternOf<Command<'x', string, number>>>().toEqualTypeOf<'x'>();
    expectTypeOf<PatternOf<Event<'y', string>>>().toEqualTypeOf<'y'>();
    expectTypeOf<PatternOf<Query<'z', string, boolean>>>().toEqualTypeOf<'z'>();
  });

  it('PayloadOf extracts payload from any contract', () => {
    expectTypeOf<PayloadOf<Command<'x', string, number>>>().toEqualTypeOf<string>();
    expectTypeOf<PayloadOf<Event<'y', boolean>>>().toEqualTypeOf<boolean>();
    expectTypeOf<PayloadOf<Query<'z', { a: 1 }, string>>>().toEqualTypeOf<{ a: 1 }>();
  });

  it('ResponseOf extracts response from Command and Query', () => {
    expectTypeOf<ResponseOf<Command<'x', string, number>>>().toEqualTypeOf<number>();
    expectTypeOf<ResponseOf<Query<'z', string, boolean>>>().toEqualTypeOf<boolean>();
  });

  it('ResponseOf returns undefined for Event', () => {
    expectTypeOf<ResponseOf<Event<'y', string>>>().toEqualTypeOf<undefined>();
  });
});

describe('Registry filter types', () => {
  it('CommandsOf filters to commands only', () => {
    type Cmds = CommandsOf<TestRegistry>;
    expectTypeOf<Cmds>().toHaveProperty('user.create');
    expectTypeOf<keyof Cmds>().toEqualTypeOf<'user.create'>();
  });

  it('EventsOf filters to events only', () => {
    type Evts = EventsOf<TestRegistry>;
    expectTypeOf<Evts>().toHaveProperty('user.created');
    expectTypeOf<keyof Evts>().toEqualTypeOf<'user.created'>();
  });

  it('QueriesOf filters to queries only', () => {
    type Qrs = QueriesOf<TestRegistry>;
    expectTypeOf<Qrs>().toHaveProperty('user.get');
    expectTypeOf<keyof Qrs>().toEqualTypeOf<'user.get'>();
  });

  it('CommandPatterns produces correct string union', () => {
    expectTypeOf<CommandPatterns<TestRegistry>>().toEqualTypeOf<'user.create'>();
  });

  it('EventPatterns produces correct string union', () => {
    expectTypeOf<EventPatterns<TestRegistry>>().toEqualTypeOf<'user.created'>();
  });

  it('QueryPatterns produces correct string union', () => {
    expectTypeOf<QueryPatterns<TestRegistry>>().toEqualTypeOf<'user.get'>();
  });

  it('SendablePatterns is union of command and query patterns', () => {
    expectTypeOf<SendablePatterns<TestRegistry>>().toEqualTypeOf<'user.create' | 'user.get'>();
  });
});

describe('ValidateRegistry', () => {
  it('accepts a valid registry (patterns match keys)', () => {
    type Valid = ValidateRegistry<TestRegistry>;
    expectTypeOf<Valid['user.create']>().toEqualTypeOf<TestRegistry['user.create']>();
    expectTypeOf<Valid['user.created']>().toEqualTypeOf<TestRegistry['user.created']>();
    expectTypeOf<Valid['user.get']>().toEqualTypeOf<TestRegistry['user.get']>();
  });
});

describe('AnyContract', () => {
  it('accepts Command, Event, and Query', () => {
    expectTypeOf<Command<'a', string, number>>().toExtend<AnyContract>();
    expectTypeOf<Event<'b', string>>().toExtend<AnyContract>();
    expectTypeOf<Query<'c', string, number>>().toExtend<AnyContract>();
  });
});
