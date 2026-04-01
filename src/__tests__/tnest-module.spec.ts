import { Test } from '@nestjs/testing';
import { TnestModule } from '../tnest.module';
import { TypedClientFactory } from '../client';
import { TNEST_OPTIONS, getClientToken } from '../constants';
import type { TnestModuleOptions } from '../interfaces';

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
  });
});
