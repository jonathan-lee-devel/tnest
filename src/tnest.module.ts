import { type DynamicModule, Module, type Provider } from '@nestjs/common';
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
      exports: [
        TypedClientFactory,
        ...clientProviders.map((p) => (p as any).provide),
      ],
    };
  }

  static forRootAsync(options: TnestModuleAsyncOptions): DynamicModule {
    const asyncProviders = TnestModule.createAsyncProviders(options);

    const clientProviders: Provider[] = [
      {
        provide: 'TNEST_CLIENT_PROVIDERS',
        useFactory: (tnestOptions: TnestModuleOptions) => {
          return TnestModule.createClientProviders(tnestOptions);
        },
        inject: [TNEST_OPTIONS],
      },
    ];

    return {
      module: TnestModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        ...asyncProviders,
        TypedClientFactory,
        ...clientProviders,
      ],
      exports: [TypedClientFactory, TNEST_OPTIONS],
    };
  }

  private static createClientProviders(options: TnestModuleOptions): Provider[] {
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

    const useClass = (options.useClass ?? options.useExisting)!;

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