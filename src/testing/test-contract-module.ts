import { type DynamicModule, Module } from '@nestjs/common';
import { TypedClientFactory } from '../client';
import { getClientToken } from '../constants';
import type { MockTypedClient } from './mock-typed-client';

interface TestClientDefinition {
  name: string;
  mock: MockTypedClient<never>;
}

@Module({})
export class TestContractModule {
  static register(clients: TestClientDefinition[]): DynamicModule {
    const clientProviders = clients.map((def) => ({
      provide: getClientToken(def.name),
      useValue: def.mock,
    }));

    return {
      module: TestContractModule,
      providers: [TypedClientFactory, ...clientProviders],
      exports: [TypedClientFactory, ...clientProviders.map((p) => p.provide)],
    };
  }
}