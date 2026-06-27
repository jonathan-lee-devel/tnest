import { type DynamicModule, type FactoryProvider, Module, type Provider } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { TypedClientFactory, type TypedClientClass } from './client';
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
    const typedClientProviders = TnestModule.createTypedClientProviders(options.typedClients ?? []);

    return {
      module: TnestModule,
      global: true,
      providers: [
        { provide: TNEST_OPTIONS, useValue: options },
        TypedClientFactory,
        ...clientProviders,
        ...typedClientProviders,
      ],
      exports: [
        TypedClientFactory,
        ...clientProviders.map((p) => p.provide),
        ...typedClientProviders.map((p) => p.provide),
      ],
    };
  }

  static forRootAsync(options: TnestModuleAsyncOptions): DynamicModule {
    const asyncProviders = TnestModule.createAsyncProviders(options);
    const typedClients = options.typedClients ?? [];
    const clientNames = TnestModule.resolveClientNames(options.clientNames, typedClients);
    const clientProviders = TnestModule.createAsyncClientProviders(clientNames);
    const typedClientProviders = TnestModule.createTypedClientProviders(typedClients);

    return {
      module: TnestModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        ...asyncProviders,
        TypedClientFactory,
        ...clientProviders,
        ...typedClientProviders,
      ],
      exports: [
        TypedClientFactory,
        TNEST_OPTIONS,
        ...clientProviders.map((p) => p.provide),
        ...typedClientProviders.map((p) => p.provide),
      ],
    };
  }

  /**
   * Union of explicitly-listed `clientNames` and the names carried by each
   * registered typed client class, so callers can pass `typedClients` alone
   * and have their underlying `ClientProxy` tokens registered automatically.
   */
  private static resolveClientNames(
    clientNames: string[] | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry generic is irrelevant at the token level
    typedClients: TypedClientClass<any>[],
  ): string[] {
    return Array.from(new Set([...(clientNames ?? []), ...typedClients.map((c) => c.clientName)]));
  }

  /**
   * Register each typed client class as an injectable provider keyed by the
   * class itself, wired to the `ClientProxy` matching its `clientName`. The
   * class token enables type-based injection (no `@Inject`) in consumers.
   */
  private static createTypedClientProviders(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry generic is irrelevant at the token level
    typedClients: TypedClientClass<any>[],
  ): FactoryProvider[] {
    return typedClients.map((ClientRef) => ({
      provide: ClientRef,
      useFactory: (proxy: ClientProxy) => new ClientRef(proxy),
      inject: [getClientToken(ClientRef.clientName)],
    }));
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
