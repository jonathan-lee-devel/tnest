import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TnestModule } from '../tnest.module';
import { TypedClient, TypedClientFactory, TypedClientRef } from '../client';
import { TNEST_OPTIONS, getClientToken } from '../constants';
import type { ContractRegistry } from '../contracts';
import type { TnestModuleOptions } from '../interfaces';

type UsersRegistry = ContractRegistry;
class UsersClient extends TypedClientRef<UsersRegistry>('USER_SERVICE') {}

@Injectable()
class UsersConsumer {
  constructor(readonly users: UsersClient) {}
}

describe('TnestModule', () => {
  describe('forRoot()', () => {
    it('provides TypedClientFactory', async () => {
      const module = await Test.createTestingModule({
        imports: [TnestModule.forRoot()],
      }).compile();

      const factory = module.get(TypedClientFactory);
      expect(factory).toBeInstanceOf(TypedClientFactory);
    });

    it('provides TNEST_OPTIONS', async () => {
      const options: TnestModuleOptions = { clients: [] };
      const module = await Test.createTestingModule({
        imports: [TnestModule.forRoot(options)],
      }).compile();

      const resolved = module.get<TnestModuleOptions>(TNEST_OPTIONS);
      expect(resolved).toBe(options);
    });

    it('registers named client tokens from client definitions', async () => {
      const module = await Test.createTestingModule({
        imports: [
          TnestModule.forRoot({
            clients: [{ name: 'USER_SERVICE', options: { transport: 0 } }],
          }),
        ],
      }).compile();

      const token = getClientToken('USER_SERVICE');
      const client = module.get<unknown>(token);
      expect(client).toBeDefined();
    });

    it('auto-registers typed client classes injectable by type (no @Inject)', async () => {
      const module = await Test.createTestingModule({
        imports: [
          TnestModule.forRoot({
            clients: [{ name: 'USER_SERVICE', options: { transport: 0 } }],
            typedClients: [UsersClient],
          }),
        ],
        providers: [UsersConsumer],
      }).compile();

      const consumer = module.get(UsersConsumer);
      expect(consumer.users).toBeInstanceOf(UsersClient);
      expect(consumer.users).toBeInstanceOf(TypedClient);
    });
  });

  describe('forRootAsync()', () => {
    it('provides TypedClientFactory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          TnestModule.forRootAsync({
            useFactory: () => ({ clients: [] }),
          }),
        ],
      }).compile();

      const factory = module.get(TypedClientFactory);
      expect(factory).toBeInstanceOf(TypedClientFactory);
    });

    it('resolves TNEST_OPTIONS from factory', async () => {
      const options: TnestModuleOptions = { clients: [] };
      const module = await Test.createTestingModule({
        imports: [
          TnestModule.forRootAsync({
            useFactory: () => options,
          }),
        ],
      }).compile();

      const resolved = module.get<TnestModuleOptions>(TNEST_OPTIONS);
      expect(resolved).toBe(options);
    });

    it('registers named client tokens when clientNames are provided', async () => {
      const module = await Test.createTestingModule({
        imports: [
          TnestModule.forRootAsync({
            clientNames: ['USER_SERVICE'],
            useFactory: () => ({
              clients: [{ name: 'USER_SERVICE', options: { transport: 0 } }],
            }),
          }),
        ],
      }).compile();

      const token = getClientToken('USER_SERVICE');
      const client = module.get<unknown>(token);
      expect(client).toBeDefined();
    });

    it('throws when clientName is not found in resolved options', async () => {
      await expect(
        Test.createTestingModule({
          imports: [
            TnestModule.forRootAsync({
              clientNames: ['MISSING_SERVICE'],
              useFactory: () => ({ clients: [] }),
            }),
          ],
        }).compile(),
      ).rejects.toThrow(/client "MISSING_SERVICE" was declared in clientNames but not found/);
    });

    it('derives the underlying client name from typedClients (clientNames optional)', async () => {
      const module = await Test.createTestingModule({
        imports: [
          TnestModule.forRootAsync({
            typedClients: [UsersClient],
            useFactory: () => ({
              clients: [{ name: 'USER_SERVICE', options: { transport: 0 } }],
            }),
          }),
        ],
        providers: [UsersConsumer],
      }).compile();

      // ClientProxy token registered without an explicit clientNames entry.
      expect(module.get<unknown>(getClientToken('USER_SERVICE'))).toBeDefined();

      const consumer = module.get(UsersConsumer);
      expect(consumer.users).toBeInstanceOf(UsersClient);
    });
  });
});
