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

| Type      | Purpose                            | Has response? |
| --------- | ---------------------------------- | ------------- |
| `Command` | Write operation (request/response) | Yes           |
| `Query`   | Read operation (request/response)  | Yes           |
| `Event`   | Notification (fire-and-forget)     | No            |

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
import type { Command, Event, Query, ContractRegistry } from '@jdevel/tnest';

export interface UserContracts extends ContractRegistry {
  'user.create': Command<'user.create', CreateUserDto, User>;
  'user.created': Event<'user.created', { userId: string; email: string }>;
  'user.get': Query<'user.get', { id: string }, User>;
}
```

### 2. Register the module

#### Static configuration with `forRoot`

Use `forRoot` when your transport configuration is known at compile time:

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
        {
          name: 'NOTIFICATION_SERVICE',
          options: {
            transport: Transport.REDIS,
            options: { host: 'localhost', port: 6379 },
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

#### Async configuration with `forRootAsync`

Use `forRootAsync` when transport configuration comes from `ConfigService`, environment variables, or another async source.

**With `useFactory`:**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { TnestModule } from '@jdevel/tnest';

@Module({
  imports: [
    TnestModule.forRootAsync({
      imports: [ConfigModule],
      // Declare client names upfront so they can be injected before the factory resolves
      clientNames: ['USER_SERVICE', 'NOTIFICATION_SERVICE'],
      useFactory: (config: ConfigService) => ({
        clients: [
          {
            name: 'USER_SERVICE',
            options: {
              transport: Transport.TCP,
              options: {
                host: config.get('USER_SERVICE_HOST'),
                port: config.get<number>('USER_SERVICE_PORT'),
              },
            },
          },
          {
            name: 'NOTIFICATION_SERVICE',
            options: {
              transport: Transport.REDIS,
              options: {
                host: config.get('REDIS_HOST'),
                port: config.get<number>('REDIS_PORT'),
              },
            },
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**With `useClass`:**

```ts
import { Injectable } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { TnestModule, type TnestOptionsFactory, type TnestModuleOptions } from '@jdevel/tnest';

@Injectable()
class TnestConfigService implements TnestOptionsFactory {
  createTnestOptions(): TnestModuleOptions {
    return {
      clients: [
        {
          name: 'USER_SERVICE',
          options: {
            transport: Transport.TCP,
            options: { host: 'localhost', port: 3001 },
          },
        },
      ],
    };
  }
}

@Module({
  imports: [
    TnestModule.forRootAsync({
      clientNames: ['USER_SERVICE'],
      useClass: TnestConfigService,
    }),
  ],
})
export class AppModule {}
```

**With `useExisting`:**

```ts
@Module({
  imports: [
    TnestModule.forRootAsync({
      clientNames: ['USER_SERVICE'],
      useExisting: TnestConfigService, // reuse an already-registered provider
      imports: [ConfigModule],
    }),
  ],
})
export class AppModule {}
```

> **Note:** The `clientNames` array tells the module which client tokens to register upfront. Each name must match a `name` in the `clients` array returned by the factory. Without `clientNames`, async clients won't be injectable by token.

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
    // send() for commands and queries — type-safe pattern, payload, and response
    const user = await firstValueFrom(this.users.send('user.get', { id: userId }));

    // emit() for events — type-safe pattern and payload, no response
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

#### Using decorators

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

#### Using handler type helpers

If you prefer explicit typing without decorators, use `TypedMessageHandler` and `TypedEventHandler`:

```ts
import type { TypedMessageHandler, TypedEventHandler } from '@jdevel/tnest';
import { MessagePattern, EventPattern } from '@nestjs/microservices';
import type { UserContracts } from './contracts/user.contracts';

@Controller()
export class UserController {
  @MessagePattern('user.create')
  create: TypedMessageHandler<UserContracts, 'user.create'> = async (payload) => {
    // payload is typed as { email: string; name: string }
    // return type is enforced as User | Promise<User> | Observable<User>
    return { id: crypto.randomUUID(), ...payload };
  };

  @EventPattern('user.created')
  handleCreated: TypedEventHandler<UserContracts, 'user.created'> = async (payload) => {
    // payload is typed as { userId: string; email: string }
    // return type is enforced as void | Promise<void>
    console.log(`User created: ${payload.userId}`);
  };
}
```

## Testing

### MockTypedClient

`MockTypedClient` records every message and returns configurable canned responses:

```ts
import { MockTypedClient } from '@jdevel/tnest';
import { firstValueFrom } from 'rxjs';
import type { UserContracts } from './contracts/user.contracts';

const mock = new MockTypedClient<UserContracts>();

// Set up canned responses
mock.setResponse('user.get', {
  id: '42',
  email: 'test@example.com',
  name: 'Test User',
});

// Use the mock exactly like a real TypedClient
const user = await firstValueFrom(mock.send('user.get', { id: '42' }));
// user.id === '42'

// Assert on recorded messages
expect(mock.messages).toEqual([{ type: 'send', pattern: 'user.get', payload: { id: '42' } }]);

// Reset between tests
mock.reset();
```

### TestContractModule

For integration tests, `TestContractModule` swaps real clients for mocks:

```ts
import { Test } from '@nestjs/testing';
import { MockTypedClient, TestContractModule, getClientToken } from '@jdevel/tnest';
import type { UserContracts } from './contracts/user.contracts';

const mockUserClient = new MockTypedClient<UserContracts>();

const module = await Test.createTestingModule({
  imports: [TestContractModule.register([{ name: 'USER_SERVICE', mock: mockUserClient }])],
  providers: [OrderService],
}).compile();

const service = module.get(OrderService);

// The mock is also retrievable by token
const client = module.get(getClientToken('USER_SERVICE'));
// client === mockUserClient
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
class ZodValidator implements ContractValidator {
  validate(payload: unknown): void {
    // your validation logic (zod, class-validator, joi, etc.)
    // throw an error if validation fails
  }
}

// Register in module providers
{ provide: CONTRACT_VALIDATOR, useClass: ZodValidator }

// Apply to handlers — validation runs before the handler method
@TypedMessagePattern<UserContracts>('user.create')
@ValidateContract()
async create(payload: CreateUserDto) {
  // payload has been validated at runtime
}
```

## Custom Serialization (Optional)

Provide custom payload serialization (protobuf, msgpack, etc.) by implementing `PayloadSerializer` and `PayloadDeserializer`:

```ts
import { Injectable } from '@nestjs/common';
import {
  PAYLOAD_SERIALIZER,
  PAYLOAD_DESERIALIZER,
  type PayloadSerializer,
  type PayloadDeserializer,
} from '@jdevel/tnest';

@Injectable()
class MsgpackSerializer implements PayloadSerializer, PayloadDeserializer {
  serialize(payload: unknown) {
    return msgpack.encode(payload);
  }
  deserialize(data: unknown) {
    return msgpack.decode(data as Buffer);
  }
}

// Register in module providers
{ provide: PAYLOAD_SERIALIZER, useClass: MsgpackSerializer }
{ provide: PAYLOAD_DESERIALIZER, useClass: MsgpackSerializer }
```

A `DefaultPayloadSerializer` (pass-through) is included and used when no custom serializer is registered.

## Utility Types

Extract type information from your contract registry:

```ts
import type {
  PatternOf,
  PayloadOf,
  ResponseOf,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
  SendablePatterns,
  CommandsOf,
  EventsOf,
  QueriesOf,
  ValidateRegistry,
} from '@jdevel/tnest';

// Extract parts of a single contract
type CreatePayload = PayloadOf<UserContracts['user.create']>; // CreateUserDto
type CreateResponse = ResponseOf<UserContracts['user.create']>; // User
type CreatePattern = PatternOf<UserContracts['user.create']>; // 'user.create'

// Pattern string unions by contract kind
type Cmds = CommandPatterns<UserContracts>; // 'user.create'
type Evts = EventPatterns<UserContracts>; // 'user.created'
type Qrys = QueryPatterns<UserContracts>; // 'user.get'
type Sendable = SendablePatterns<UserContracts>; // 'user.create' | 'user.get'

// Filter a registry to contracts of a specific kind
type OnlyCommands = CommandsOf<UserContracts>; // { 'user.create': Command<...> }
type OnlyEvents = EventsOf<UserContracts>; // { 'user.created': Event<...> }
type OnlyQueries = QueriesOf<UserContracts>; // { 'user.get': Query<...> }

// Validate that a registry's keys match its pattern type parameters
type Validated = ValidateRegistry<UserContracts>;
// Produces an error type if any key doesn't match its contract's pattern
```

## API Reference

| Export                                                | Kind      | Description                                         |
| ----------------------------------------------------- | --------- | --------------------------------------------------- |
| `TnestModule`                                         | Module    | Dynamic module with `forRoot` / `forRootAsync`      |
| `TypedClient`                                         | Class     | Type-safe wrapper around `ClientProxy`              |
| `TypedClientFactory`                                  | Service   | Creates `TypedClient` instances                     |
| `TypedMessagePattern`                                 | Decorator | Typed `@MessagePattern` for commands/queries        |
| `TypedEventPattern`                                   | Decorator | Typed `@EventPattern` for events                    |
| `ValidateContract`                                    | Decorator | Opt-in runtime payload validation                   |
| `MockTypedClient`                                     | Class     | Test double that records messages                   |
| `TestContractModule`                                  | Module    | Registers mock clients for testing                  |
| `getClientToken`                                      | Function  | Returns injection token for a named client          |
| `defineRegistry`                                      | Function  | Builder helper for defining contract registries     |
| `command` / `event` / `query`                         | Functions | Builder helpers for individual contracts            |
| `Command` / `Event` / `Query`                         | Type      | Contract type interfaces                            |
| `ContractRegistry`                                    | Type      | Base type for a registry of contracts               |
| `ValidateRegistry`                                    | Type      | Validates registry keys match contract patterns     |
| `PayloadOf` / `ResponseOf` / `PatternOf`              | Type      | Extract parts of a contract                         |
| `CommandsOf` / `EventsOf` / `QueriesOf`               | Type      | Filter registry by contract kind                    |
| `CommandPatterns` / `EventPatterns` / `QueryPatterns` | Type      | Pattern string unions by kind                       |
| `SendablePatterns`                                    | Type      | Union of command + query patterns                   |
| `TypedMessageHandler`                                 | Type      | Function signature for command/query handlers       |
| `TypedEventHandler`                                   | Type      | Function signature for event handlers               |
| `TnestModuleOptions`                                  | Interface | Configuration for `forRoot`                         |
| `TnestModuleAsyncOptions`                             | Interface | Configuration for `forRootAsync`                    |
| `TnestOptionsFactory`                                 | Interface | Implement for `useClass`/`useExisting` async config |
| `TnestClientDefinition`                               | Interface | Client name + transport options pair                |
| `ContractValidator`                                   | Interface | Implement for runtime validation                    |
| `PayloadSerializer` / `PayloadDeserializer`           | Interface | Implement for custom serialization                  |
| `DefaultPayloadSerializer`                            | Class     | Pass-through serializer (default)                   |
| `CONTRACT_VALIDATOR`                                  | Token     | Injection token for validator                       |
| `PAYLOAD_SERIALIZER` / `PAYLOAD_DESERIALIZER`         | Token     | Injection tokens for serialization                  |
| `TNEST_OPTIONS`                                       | Token     | Injection token for module options                  |

## License

MIT
