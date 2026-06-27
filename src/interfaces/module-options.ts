import type { ModuleMetadata, Type } from '@nestjs/common';
import type { ClientOptions } from '@nestjs/microservices';
import type { TypedClientClass } from '../client';

export interface TnestClientDefinition {
  name: string;
  options: ClientOptions;
}

export interface TnestModuleOptions {
  clients?: TnestClientDefinition[];
  /**
   * Typed client classes (minted via `TypedClientRef`) to auto-register as
   * injectable providers. Each is wired to the `ClientProxy` matching its
   * static `clientName` and exported globally, so it can be injected by type
   * without an explicit `@Inject(...)`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry generic is irrelevant at the token level
  typedClients?: TypedClientClass<any>[];
}

export interface TnestOptionsFactory {
  createTnestOptions(): TnestModuleOptions | Promise<TnestModuleOptions>;
}

export interface TnestModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Client names to register as injectable tokens.
   * Each name will be resolvable via `getClientToken(name)` once the async options resolve.
   * Required when your factory provides `clients` and you need to inject them by token.
   */
  clientNames?: string[];
  /**
   * Typed client classes (minted via `TypedClientRef`) to auto-register as
   * injectable providers. Their static `clientName` is also used to register
   * the underlying `ClientProxy`, so listing them here makes `clientNames`
   * optional for those names.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry generic is irrelevant at the token level
  typedClients?: TypedClientClass<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches NestJS ModuleMetadata signature
  useFactory?: (...args: any[]) => TnestModuleOptions | Promise<TnestModuleOptions>;
  useClass?: Type<TnestOptionsFactory>;
  useExisting?: Type<TnestOptionsFactory>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches NestJS inject token signature
  inject?: any[];
}
