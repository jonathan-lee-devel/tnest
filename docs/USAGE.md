# @jdevel/tnest Usage Guide

Type-safe communication between NestJS microservices. Define your message contracts once, and the compiler enforces them everywhere.

## Installation

```bash
npm install @jdevel/tnest
```

Peer dependencies (must be installed in your project):

```bash
npm install @nestjs/common @nestjs/microservices reflect-metadata rxjs
```

---

## 1. Define Contracts

Contracts are shared TypeScript types that describe the messages exchanged between your services. There are three kinds:

- **Command** — request/response (write operations)
- **Query** — request/response (read operations)
- **Event** — fire-and-forget (notifications)

### Option A: Interface-based (explicit)

```ts
// contracts/user.contracts.ts
import type { Command, Event, Query } from '@jdevel/tnest';

interface CreateUserDto {
  email: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface UserCreatedPayload {
  userId: string;
  email: string;
}

export interface UserContracts {
  'user.create': Command<'user.create', CreateUserDto, User>;
  'user.created': Event<'user.created', UserCreatedPayload>;
  'user.get': Query<'user.get', { id: string }, User>;
  'user.list': Query<'user.list', { page: number; limit: number }, User[]>;
}
```

### Option B: Builder helpers (concise)

The `defineRegistry`, `command`, `event`, and `query` helpers give you the same types with less boilerplate. Pattern strings are inferred from the object keys automatically.

```ts
// contracts/user.contracts.ts
import { defineRegistry, command, event, query } from '@jdevel/tnest';

export const userContracts = defineRegistry({
  'user.create': command<CreateUserDto, User>(),
  'user.created': event<UserCreatedPayload>(),
  'user.get': query<{ id: string }, User>(),
  'user.list': query<{ page: number; limit: number }, User[]>(),
});

export type UserContracts = typeof userContracts;
```

Both approaches produce the same type — use whichever you prefer.

---

## 2. Register the Module

Import `TnestModule` in your application module and configure your microservice clients.

### Basic setup with `forRoot`

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { TnestModule } from '@jdevel/tnest';
import { Transport } from '@nestjs/microservices';

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

### Async setup with `forRootAsync`

Use this when your transport config comes from `ConfigService` or another async source.

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TnestModule } from '@jdevel/tnest';
import { Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    }),
  ],
})
export class AppModule {}
```

---

## 3. Send Messages (Producer Side)

Inject the `TypedClientFactory` and a `ClientProxy` to create a type-safe client.

```ts
// order.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TypedClientFactory, TypedClient, getClientToken } from '@jdevel/tnest';
import { firstValueFrom } from 'rxjs';
import type { UserContracts } from '../contracts/user.contracts';

@Injectable()
export class OrderService {
  private readonly userClient: TypedClient<UserContracts>;

  constructor(
    private readonly factory: TypedClientFactory,
    @Inject(getClientToken('USER_SERVICE')) userProxy: ClientProxy,
  ) {
    this.userClient = factory.create<UserContracts>(userProxy);
  }

  async createOrder(userId: string) {
    // Type-safe: the compiler knows this takes { id: string } and returns User
    const user = await firstValueFrom(this.userClient.send('user.get', { id: userId }));

    // Type-safe: the compiler knows this takes UserCreatedPayload
    this.userClient.emit('user.created', {
      userId: user.id,
      email: user.email,
    });

    return { orderId: '123', user };
  }
}
```

### What the compiler catches

```ts
// ERROR: 'user.delete' is not a valid pattern
this.userClient.send('user.delete', { id: '1' });

// ERROR: payload type mismatch — expects { id: string }, got { name: string }
this.userClient.send('user.get', { name: 'test' });

// ERROR: cannot send() an event — use emit() instead
this.userClient.send('user.created', { userId: '1', email: 'a@b.com' });
```

---

## 4. Handle Messages (Consumer Side)

Use the typed decorators to enforce contracts on your message handlers.

### Commands and Queries

Pass the pattern as a second type parameter to enforce the method's parameter and return types against the contract. The compiler will error if they don't match.

```ts
// user.controller.ts
import { Controller } from '@nestjs/common';
import { TypedMessagePattern } from '@jdevel/tnest';
import type { UserContracts } from '../contracts/user.contracts';

@Controller()
export class UserController {
  // The second type parameter enforces that payload is CreateUserDto and return is User
  @TypedMessagePattern<UserContracts, 'user.create'>('user.create')
  async createUser(payload: { email: string; name: string }) {
    const user = await this.userRepo.create(payload);
    return user; // Must return User (compiler enforces this)
  }

  @TypedMessagePattern<UserContracts, 'user.get'>('user.get')
  async getUser(payload: { id: string }) {
    return this.userRepo.findById(payload.id);
  }
}
```

> **Note:** Omitting the second type parameter (e.g., `@TypedMessagePattern<UserContracts>('user.create')`) preserves the existing behavior — the pattern string is validated but the method signature is not constrained.

### Events

```ts
// notification.controller.ts
import { Controller } from '@nestjs/common';
import { TypedEventPattern } from '@jdevel/tnest';
import type { UserContracts } from '../contracts/user.contracts';

@Controller()
export class NotificationController {
  @TypedEventPattern<UserContracts, 'user.created'>('user.created')
  async handleUserCreated(payload: { userId: string; email: string }) {
    await this.mailer.sendWelcome(payload.email);
  }
}
```

### What the compiler catches (handlers)

When the second type parameter is provided, the compiler catches handler signature mismatches:

```ts
@TypedMessagePattern<UserContracts, 'user.create'>('user.create')
async create(payload: { wrong: number }) {
  //                   ~~~~~~~~~~~~~~~~ ERROR: expects { email: string; name: string }
  return { id: '1' };
}

@TypedMessagePattern<UserContracts, 'user.get'>('user.get')
async get(payload: { id: string }): Promise<{ wrong: boolean }> {
  //                                         ~~~~~~~~~~~~~~~~~ ERROR: must return User
  return { wrong: true };
}
```

### Handler type helpers (without decorators)

If you prefer to type your handlers manually without using the decorators:

```ts
import type { TypedMessageHandler, TypedEventHandler } from '@jdevel/tnest';
import type { UserContracts } from '../contracts/user.contracts';

// Strongly typed function signature
const handleCreateUser: TypedMessageHandler<UserContracts, 'user.create'> = async (payload) => {
  // payload is typed as CreateUserDto
  // return type must be User
  return { id: '1', email: payload.email, name: payload.name };
};

const handleUserCreated: TypedEventHandler<UserContracts, 'user.created'> = async (payload) => {
  // payload is typed as UserCreatedPayload
  // return type must be void
  console.log(`User created: ${payload.userId}`);
};
```

---

## 5. Runtime Validation (Optional)

By default, tnest enforces contracts at compile time only. If you also want runtime payload validation, use the `@ValidateContract()` decorator with a custom validator.

### Implement the `ContractValidator` interface

```ts
// zod-validator.ts
import { Injectable } from '@nestjs/common';
import { type ContractValidator } from '@jdevel/tnest';
import { z } from 'zod';

@Injectable()
export class ZodContractValidator implements ContractValidator {
  private schemas = new Map<string, z.ZodSchema>();

  register(pattern: string, schema: z.ZodSchema) {
    this.schemas.set(pattern, schema);
  }

  validate(payload: unknown): void {
    // Your validation logic here
    // Throw an RpcException on failure
  }
}
```

### Register the validator

```ts
// app.module.ts
import { CONTRACT_VALIDATOR } from '@jdevel/tnest';
import { ZodContractValidator } from './zod-validator';

@Module({
  providers: [{ provide: CONTRACT_VALIDATOR, useClass: ZodContractValidator }],
})
export class AppModule {}
```

### Use on handlers

```ts
import { ValidateContract, TypedMessagePattern } from '@jdevel/tnest';

@Controller()
export class UserController {
  @TypedMessagePattern<UserContracts, 'user.create'>('user.create')
  @ValidateContract()
  async createUser(payload: CreateUserDto) {
    // payload has been validated at runtime before reaching here
    return this.userRepo.create(payload);
  }
}
```

---

## 6. Custom Serialization (Optional)

Provide custom serializers for payloads (e.g. protobuf, msgpack) by implementing the `PayloadSerializer` and `PayloadDeserializer` interfaces.

```ts
import { Injectable } from '@nestjs/common';
import {
  type PayloadSerializer,
  type PayloadDeserializer,
  PAYLOAD_SERIALIZER,
  PAYLOAD_DESERIALIZER,
} from '@jdevel/tnest';

@Injectable()
export class MsgpackSerializer implements PayloadSerializer, PayloadDeserializer {
  serialize(payload: unknown): Buffer {
    return msgpack.encode(payload);
  }

  deserialize(data: unknown): unknown {
    return msgpack.decode(data as Buffer);
  }
}

// Register in your module
@Module({
  providers: [
    { provide: PAYLOAD_SERIALIZER, useClass: MsgpackSerializer },
    { provide: PAYLOAD_DESERIALIZER, useClass: MsgpackSerializer },
  ],
})
export class AppModule {}
```

---

## 7. Testing

tnest provides `MockTypedClient` and `TestContractModule` to make testing straightforward.

### Unit testing a service

```ts
import { MockTypedClient } from '@jdevel/tnest';
import type { UserContracts } from '../contracts/user.contracts';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let mockClient: MockTypedClient<UserContracts>;

  beforeEach(() => {
    mockClient = new MockTypedClient<UserContracts>();
  });

  afterEach(() => {
    mockClient.reset();
  });

  it('should fetch user when creating an order', async () => {
    // Configure a canned response — type-safe!
    mockClient.setResponse('user.get', {
      id: '42',
      email: 'test@example.com',
      name: 'Test User',
    });

    // Use the mock client directly
    const user = await firstValueFrom(mockClient.send('user.get', { id: '42' }));

    expect(user.id).toBe('42');
    expect(mockClient.messages).toHaveLength(1);
    expect(mockClient.messages[0]).toEqual({
      type: 'send',
      pattern: 'user.get',
      payload: { id: '42' },
    });
  });
});
```

### Integration testing with `TestContractModule`

```ts
import { Test } from '@nestjs/testing';
import { MockTypedClient, TestContractModule, getClientToken } from '@jdevel/tnest';
import type { UserContracts } from '../contracts/user.contracts';
import { OrderService } from './order.service';

describe('OrderService (integration)', () => {
  let orderService: OrderService;
  let mockClient: MockTypedClient<UserContracts>;

  beforeEach(async () => {
    mockClient = new MockTypedClient<UserContracts>();

    const module = await Test.createTestingModule({
      imports: [TestContractModule.register([{ name: 'USER_SERVICE', mock: mockClient }])],
      providers: [OrderService],
    }).compile();

    orderService = module.get(OrderService);
  });

  it('should create an order', async () => {
    mockClient.setResponse('user.get', {
      id: '42',
      email: 'test@example.com',
      name: 'Test',
    });

    const result = await orderService.createOrder('42');

    expect(result.user.id).toBe('42');
    expect(mockClient.messages).toContainEqual({
      type: 'send',
      pattern: 'user.get',
      payload: { id: '42' },
    });
  });
});
```

---

## 8. Utility Types Reference

Extract type information from your contracts:

```ts
import type {
  PatternOf,
  PayloadOf,
  ResponseOf,
  CommandsOf,
  EventsOf,
  QueriesOf,
  CommandPatterns,
  EventPatterns,
  QueryPatterns,
  SendablePatterns,
} from '@jdevel/tnest';
import type { UserContracts } from '../contracts/user.contracts';

// Extract the payload type for a specific contract
type CreatePayload = PayloadOf<UserContracts['user.create']>;
// => CreateUserDto

// Extract the response type
type CreateResponse = ResponseOf<UserContracts['user.create']>;
// => User

// Get a union of all command pattern strings
type CmdPatterns = CommandPatterns<UserContracts>;
// => 'user.create'

// Get a union of all event pattern strings
type EvtPatterns = EventPatterns<UserContracts>;
// => 'user.created'

// Get a union of all query pattern strings
type QryPatterns = QueryPatterns<UserContracts>;
// => 'user.get' | 'user.list'

// Get all sendable patterns (commands + queries)
type Sendable = SendablePatterns<UserContracts>;
// => 'user.create' | 'user.get' | 'user.list'

// Filter the registry to only commands
type JustCommands = CommandsOf<UserContracts>;
// => { 'user.create': Command<'user.create', CreateUserDto, User> }
```

---

## Full Example: Two Services over TCP

### Shared contracts (published as a package or shared via path alias)

```ts
// packages/contracts/src/user.contracts.ts
import { defineRegistry, command, event, query } from '@jdevel/tnest';

export interface CreateUserDto {
  email: string;
  name: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
}

export const userContracts = defineRegistry({
  'user.create': command<CreateUserDto, User>(),
  'user.created': event<{ userId: string }>(),
  'user.get': query<{ id: string }, User>(),
});
export type UserContracts = typeof userContracts;
```

### User service (consumer — listens on port 3001)

```ts
// apps/user-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';

@Module({ controllers: [UserController] })
export class AppModule {}

// apps/user-service/src/user.controller.ts
import { Controller } from '@nestjs/common';
import { TypedMessagePattern, TypedEventPattern } from '@jdevel/tnest';
import type { UserContracts } from '@myorg/contracts';

@Controller()
export class UserController {
  @TypedMessagePattern<UserContracts, 'user.create'>('user.create')
  async create(payload: { email: string; name: string }) {
    return { id: crypto.randomUUID(), ...payload };
  }

  @TypedMessagePattern<UserContracts, 'user.get'>('user.get')
  async get(payload: { id: string }) {
    return { id: payload.id, email: 'user@example.com', name: 'Example' };
  }
}

// apps/user-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: { host: 'localhost', port: 3001 },
  });
  await app.listen();
}
bootstrap();
```

### API gateway (producer — calls user service)

```ts
// apps/api-gateway/src/app.module.ts
import { Module } from '@nestjs/common';
import { TnestModule } from '@jdevel/tnest';
import { Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';

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
  controllers: [GatewayController],
})
export class AppModule {}

// apps/api-gateway/src/gateway.controller.ts
import { Controller, Post, Get, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TypedClientFactory, TypedClient, getClientToken } from '@jdevel/tnest';
import { firstValueFrom } from 'rxjs';
import type { UserContracts, CreateUserDto } from '@myorg/contracts';

@Controller('users')
export class GatewayController {
  private readonly users: TypedClient<UserContracts>;

  constructor(
    factory: TypedClientFactory,
    @Inject(getClientToken('USER_SERVICE')) proxy: ClientProxy,
  ) {
    this.users = factory.create<UserContracts>(proxy);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return firstValueFrom(this.users.send('user.create', dto));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.users.send('user.get', { id }));
  }
}
```
