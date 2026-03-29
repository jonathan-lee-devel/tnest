import type { ModuleMetadata, Type } from '@nestjs/common';
import type { ClientOptions } from '@nestjs/microservices';

export interface TnestClientDefinition {
  name: string;
  options: ClientOptions;
}

export interface TnestModuleOptions {
  clients?: TnestClientDefinition[];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches NestJS ModuleMetadata signature
  useFactory?: (...args: any[]) => TnestModuleOptions | Promise<TnestModuleOptions>;
  useClass?: Type<TnestOptionsFactory>;
  useExisting?: Type<TnestOptionsFactory>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches NestJS inject token signature
  inject?: any[];
}
