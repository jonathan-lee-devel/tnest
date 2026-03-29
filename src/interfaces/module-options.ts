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
  useFactory?: (...args: any[]) => TnestModuleOptions | Promise<TnestModuleOptions>;
  useClass?: Type<TnestOptionsFactory>;
  useExisting?: Type<TnestOptionsFactory>;
  inject?: any[];
}