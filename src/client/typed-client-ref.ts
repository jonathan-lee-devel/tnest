import type { Type } from '@nestjs/common';
import type { ContractRegistry } from '../contracts';
import { TypedClient } from './typed-client';

/**
 * A concrete, injectable class that represents a {@link TypedClient} bound to a
 * single named microservice client.
 *
 * Because TypeScript generics are erased at runtime, every `TypedClient<...>`
 * looks identical to NestJS's dependency injector. A `TypedClientClass` is a
 * *distinct runtime class* per microservice, so it can be used as an injection
 * token that NestJS resolves **by type** — no `@Inject(...)` required.
 *
 * The static `clientName` lets {@link TnestModule} discover which underlying
 * `ClientProxy` token (see `getClientToken`) the class should be wired to.
 */
export interface TypedClientClass<TRegistry extends ContractRegistry> extends Type<
  TypedClient<TRegistry>
> {
  /** The microservice client name this class is bound to. */
  readonly clientName: string;
}

/**
 * Mint a distinct, injectable {@link TypedClient} subclass bound to a named
 * microservice client.
 *
 * Declare one per microservice in the consuming application:
 *
 * ```ts
 * export class OrdersClient extends TypedClientRef<MicroOrdersContracts>(ORDER_SERVICE) {}
 * ```
 *
 * Pass the resulting class to `TnestModule.forRoot{,Async}({ typedClients: [...] })`
 * and inject it by type anywhere — no provider boilerplate, no `@Inject`:
 *
 * ```ts
 * constructor(private readonly orders: OrdersClient) {}
 * ```
 *
 * @param clientName The microservice client name. Must match a client registered
 *   with `TnestModule` (the same name used in `clients[].name` / `clientNames`).
 */
export function TypedClientRef<TRegistry extends ContractRegistry>(
  clientName: string,
): TypedClientClass<TRegistry> {
  class TypedClientRefHost extends TypedClient<TRegistry> {
    static readonly clientName = clientName;
  }

  return TypedClientRefHost as TypedClientClass<TRegistry>;
}
