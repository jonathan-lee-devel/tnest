import { type DynamicModule, type FactoryProvider, Module, type Provider } from '@nestjs/common';
import { ClientProxyFactory } from '@nestjs/microservices';
import { TypedClientFactory } from './client';
import { TNEST_OPTIONS, getClientToken } from './constants';
import type {
  TnestModuleOptions,
  TnestModuleAsyncOptions,
  TnestOptionsFactory,
} from './interfaces';

@Module({})
export class TnestModule {
  static forRoot(options: TnestModuleOptions = {}): DynamicModule {
    const clientProviders = TnestModule.createClientProviders(options);

    return {
      module: TnestModule,
      global: true,
      providers: [
        { provide: TNEST_OPTIONS, useValue: options },
        TypedClientFactory,
        ...clientProviders,
      ],
      exports: [TypedClientFactory, ...clientProviders.map((p) => p.provide)],
    };
  }

  static forRootAsync(options: TnestModuleAsyncOptions): DynamicModule {
    const asyncProviders = TnestModule.createAsyncProviders(options);
    const clientProviders = TnestModule.createAsyncClientProviders(options.clientNames ?? []);

    return {
      module: TnestModule,
      global: true,
      imports: options.imports ?? [],
      providers: [...asyncProviders, TypedClientFactory, ...clientProviders],
      exports: [TypedClientFactory, TNEST_OPTIONS, ...clientProviders.map((p) => p.provide)],
    };
  }

  private static createAsyncClientProviders(clientNames: string[]): FactoryProvider[] {
    return clientNames.map((name) => ({
      provide: getClientToken(name),
      useFactory: (tnestOptions: TnestModuleOptions) => {
        const clientDef = tnestOptions.clients?.find((c) => c.name === name);
        if (!clientDef) {
          throw new Error(
            `TnestModule: client "${name}" was declared in clientNames but not found in resolved options.clients`,
          );
        }
        return ClientProxyFactory.create(clientDef.options);
      },
      inject: [TNEST_OPTIONS],
    }));
  }

  private static createClientProviders(options: TnestModuleOptions): FactoryProvider[] {
    if (!options.clients?.length) return [];

    return options.clients.map((clientDef) => ({
      provide: getClientToken(clientDef.name),
      useFactory: () => ClientProxyFactory.create(clientDef.options),
    }));
  }

  private static createAsyncProviders(options: TnestModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: TNEST_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }

    const useClass = options.useClass ?? options.useExisting;
    if (!useClass) {
      throw new Error(
        'TnestModule.forRootAsync() requires one of: useFactory, useClass, or useExisting',
      );
    }

    const providers: Provider[] = [
      {
        provide: TNEST_OPTIONS,
        useFactory: async (factory: TnestOptionsFactory) => factory.createTnestOptions(),
        inject: [useClass],
      },
    ];

    if (options.useClass) {
      providers.push({ provide: useClass, useClass });
    }

    return providers;
  }
}
