# @jdevel/tnest

Type-safe communication between NestJS microservices.

Define your message contracts once as TypeScript types, and the compiler enforces them across every producer and consumer — eliminating runtime type mismatches between services.

## Features

- **Compile-time safety** -- mismatched patterns, payloads, or responses are caught before deployment
- **Transport-agnostic** -- works with any NestJS transport (TCP, Redis, NATS, RabbitMQ, Kafka, gRPC)
- **NestJS-native** -- standard modules, decorators, and dependency injection
- **Zero runtime overhead** -- type enforcement happens at compile time; no runtime schema checking unless you opt in
- **First-class testing** -- `MockTypedClient` and `TestContractModule` included

## Installation

```bash
npm install @jdevel/tnest
```

Peer dependencies:

```bash
npm install @nestjs/common @nestjs/microservices reflect-metadata rxjs
```

## Quick Start

### 1. Define contracts

Contracts describe the messages exchanged between services. There are three kinds:

| Type | Purpose | Has response? |
|------|---------|---------------|
| `Command` | Write operation (request/response) | Yes |
| `Query` | Read operation (request/response) | Yes |
| `Event` | Notification (fire-and-forget) | No |

```ts
// contracts/user.contracts.ts
import { defineRegistry, command, event, query } from '@jdevel/tnest';

interface CreateUserDto {
  email: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

export const userContracts = defineRegistry({
  'user.create': command<CreateUserDto, User>(),
  'user.created': event<{ userId: string; email: string }>(),
  'user.get': query<{ id: string }, User>(),
});

export type UserContracts = typeof userContracts;
```

You can also define contracts with explicit interfaces if you prefer:

```ts
import type { Command, Event, Query } from '@jdevel/tnest';

export interface UserContracts {
  'user.create': Command<'user.create', CreateUserDto, User>;
  'user.created': Event<'user.created', { userId: string; email: string }>;
  'user.get': Query<'user.get', { id: string }, User>;
}
```

### 2. Register the module

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { TnestModule } from '@jdevel/tnest';

@Module({
  imports: [
    TnestModule.forRoot({
      clients: [
        {
          name: 'USER_SERVICE',
          options: {
            transport: Transport.TCP,
            options: { host: 'localhost', port: 3001 },
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### 3. Send messages (producer)

```ts
// order.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TypedClientFactory, TypedClient, getClientToken } from '@jdevel/tnest';
import { firstValueFrom } from 'rxjs';
import type { UserContracts } from './contracts/user.contracts';

@Injectable()
export class OrderService {
  private readonly users: TypedClient<UserContracts>;

  constructor(
    factory: TypedClientFactory,
    @Inject(getClientToken('USER_SERVICE')) proxy: ClientProxy,
  ) {
    this.users = factory.create<UserContracts>(proxy);
  }

  async createOrder(userId: string) {
    const user = await firstValueFrom(
      this.users.send('user.get', { id: userId }),
    );

    this.users.emit('user.created', {
      userId: user.id,
      email: user.email,
    });

    return { orderId: '123', user };
  }
}
```

The compiler catches contract violations:

```ts
this.users.send('user.delete', { id: '1' });
//               ~~~~~~~~~~~~ ERROR: not a valid pattern

this.users.send('user.get', { name: 'test' });
//                           ~~~~~~~~~~~~~~~~ ERROR: expects { id: string }

this.users.send('user.created', { userId: '1', email: 'a@b.com' });
//               ~~~~~~~~~~~~~~ ERROR: 'user.created' is an event, use emit()
```

### 4. Handle messages (consumer)

```ts
// user.controller.ts
import { Controller } from '@nestjs/common';
import { TypedMessagePattern, TypedEventPattern } from '@jdevel/tnest';
import type { UserContracts } from './contracts/user.contracts';

@Controller()
export class UserController {
  @TypedMessagePattern<UserContracts>('user.create')
  async create(payload: { email: string; name: string }) {
    return { id: crypto.randomUUID(), ...payload };
  }

  @TypedMessagePattern<UserContracts>('user.get')
  async get(payload: { id: string }) {
    return { id: payload.id, email: 'user@example.com', name: 'Example' };
  }

  @TypedEventPattern<UserContracts>('user.created')
  async handleCreated(payload: { userId: string; email: string }) {
    console.log(`User created: ${payload.userId}`);
  }
}
```

## Testing

`MockTypedClient` records every message and returns configurable canned responses:

```ts
import { MockTypedClient } from '@jdevel/tnest';
import { firstValueFrom } from 'rxjs';
import type { UserContracts } from './contracts/user.contracts';

const mock = new MockTypedClient<UserContracts>();

mock.setResponse('user.get', {
  id: '42',
  email: 'test@example.com',
  name: 'Test User',
});

const user = await firstValueFrom(mock.send('user.get', { id: '42' }));
// user.id === '42'

expect(mock.messages).toEqual([
  { type: 'send', pattern: 'user.get', payload: { id: '42' } },
]);
```

For integration tests, `TestContractModule` swaps real clients for mocks:

```ts
import { Test } from '@nestjs/testing';
import { MockTypedClient, TestContractModule } from '@jdevel/tnest';
import type { UserContracts } from './contracts/user.contracts';

const mock = new MockTypedClient<UserContracts>();

const module = await Test.createTestingModule({
  imports: [
    TestContractModule.register([
      { name: 'USER_SERVICE', mock },
    ]),
  ],
  providers: [OrderService],
}).compile();
```

## Async Module Configuration

Use `forRootAsync` when transport config comes from `ConfigService` or another async source:

```ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TnestModule } from '@jdevel/tnest';
import { Transport } from '@nestjs/microservices';

TnestModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    clients: [
      {
        name: 'USER_SERVICE',
        options: {
          transport: Transport.TCP,
          options: {
            host: config.get('USER_SERVICE_HOST'),
            port: config.get('USER_SERVICE_PORT'),
          },
        },
      },
    ],
  }),
  inject: [ConfigService],
});
```

## Runtime Validation (Optional)

By default, contracts are enforced at compile time only. To add runtime payload validation, implement the `ContractValidator` interface and apply `@ValidateContract()`:

```ts
import { Injectable } from '@nestjs/common';
import {
  CONTRACT_VALIDATOR,
  ValidateContract,
  TypedMessagePattern,
  type ContractValidator,
} from '@jdevel/tnest';

@Injectable()
class MyValidator implements ContractValidator {
  validate(payload: unknown): void {
    // your validation logic (zod, class-validator, joi, etc.)
  }
}

// Register in module providers
{ provide: CONTRACT_VALIDATOR, useClass: MyValidator }

// Apply to handlers
@TypedMessagePattern<UserContracts>('user.create')
@ValidateContract()
async create(payload: CreateUserDto) {
  // payload has been validated at runtime
}
```

## Custom Serialization (Optional)

Provide custom payload serialization (protobuf, msgpack, etc.) by implementing `PayloadSerializer` and `PayloadDeserializer`:

```ts
import {
  PAYLOAD_SERIALIZER,
  PAYLOAD_DESERIALIZER,
  type PayloadSerializer,
  type PayloadDeserializer,
} from '@jdevel/tnest';

@Injectable()
class MsgpackSerializer implements PayloadSerializer, PayloadDeserializer {
  serialize(payload: unknown) { return msgpack.encode(payload); }
  deserialize(data: unknown) { return msgpack.decode(data as Buffer); }
}

// Register in module providers
{ provide: PAYLOAD_SERIALIZER, useClass: MsgpackSerializer }
{ provide: PAYLOAD_DESERIALIZER, useClass: MsgpackSerializer }
```

## Utility Types

Extract type information from your contract registry:

```ts
import type {
  PayloadOf,
  ResponseOf,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
  SendablePatterns,
  CommandsOf,
  EventsOf,
  QueriesOf,
} from '@jdevel/tnest';

type Payload = PayloadOf<UserContracts['user.create']>;   // CreateUserDto
type Response = ResponseOf<UserContracts['user.create']>;  // User
type Cmds = CommandPatterns<UserContracts>;                 // 'user.create'
type Evts = EventPatterns<UserContracts>;                  // 'user.created'
type Qrys = QueryPatterns<UserContracts>;                  // 'user.get'
type Sendable = SendablePatterns<UserContracts>;            // 'user.create' | 'user.get'
```

## API Reference

| Export | Kind | Description |
|--------|------|-------------|
| `TnestModule` | Module | Dynamic module with `forRoot` / `forRootAsync` |
| `TypedClient` | Class | Type-safe wrapper around `ClientProxy` |
| `TypedClientFactory` | Service | Creates `TypedClient` instances |
| `TypedMessagePattern` | Decorator | Typed `@MessagePattern` for commands/queries |
| `TypedEventPattern` | Decorator | Typed `@EventPattern` for events |
| `MockTypedClient` | Class | Test double that records messages |
| `TestContractModule` | Module | Registers mock clients for testing |
| `ValidateContract` | Decorator | Opt-in runtime payload validation |
| `getClientToken` | Function | Returns injection token for a named client |
| `defineRegistry` | Function | Builder helper for defining contract registries |
| `command` / `event` / `query` | Functions | Builder helpers for individual contracts |
| `Command` / `Event` / `Query` | Type | Contract type interfaces |
| `ContractRegistry` | Type | Base type for a registry of contracts |
| `PayloadOf` / `ResponseOf` / `PatternOf` | Type | Extract parts of a contract |
| `CommandsOf` / `EventsOf` / `QueriesOf` | Type | Filter registry by contract kind |
| `CommandPatterns` / `EventPatterns` / `QueryPatterns` | Type | Pattern string unions by kind |
| `SendablePatterns` | Type | Union of command + query patterns |
| `ContractValidator` | Interface | Implement for runtime validation |
| `PayloadSerializer` / `PayloadDeserializer` | Interface | Implement for custom serialization |
| `CONTRACT_VALIDATOR` | Token | Injection token for validator |
| `PAYLOAD_SERIALIZER` / `PAYLOAD_DESERIALIZER` | Token | Injection tokens for serialization |

## License

MIT