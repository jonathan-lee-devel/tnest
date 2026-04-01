import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import type { ClientProxy } from '@nestjs/microservices';
import { TypedClient } from '../typed-client';
import type { Command } from '../../contracts/command';
import type { Event } from '../../contracts/event';
import type { Query } from '../../contracts/query';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'user.create': Command<'user.create', { name: string }, { id: string }>;
  'user.created': Event<'user.created', { userId: string }>;
  'user.get': Query<'user.get', { id: string }, { name: string }>;
}

function createMockClientProxy(): jest.Mocked<ClientProxy> {
  return {
    send: jest.fn().mockReturnValue(of(undefined)),
    emit: jest.fn().mockReturnValue(of(undefined)),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
  } as unknown as jest.Mocked<ClientProxy>;
}

describe('TypedClient', () => {
  let mockProxy: jest.Mocked<ClientProxy>;
  let client: TypedClient<TestRegistry>;

  beforeEach(() => {
    mockProxy = createMockClientProxy();
    client = new TypedClient<TestRegistry>(mockProxy);
  });

  describe('send()', () => {
    it('delegates to ClientProxy.send() with pattern and payload', async () => {
      const payload = { name: 'Alice' };
      const response = { id: '123' };
      mockProxy.send.mockReturnValue(of(response));

      const result = await firstValueFrom(client.send('user.create', payload));

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProxy.send).toHaveBeenCalledWith('user.create', payload);
      expect(result).toEqual(response);
    });

    it('works with query patterns', async () => {
      const payload = { id: '123' };
      const response = { name: 'Alice' };
      mockProxy.send.mockReturnValue(of(response));

      const result = await firstValueFrom(client.send('user.get', payload));

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProxy.send).toHaveBeenCalledWith('user.get', payload);
      expect(result).toEqual(response);
    });
  });

  describe('emit()', () => {
    it('delegates to ClientProxy.emit() with pattern and payload', async () => {
      const payload = { userId: '123' };

      await firstValueFrom(client.emit('user.created', payload));

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProxy.emit).toHaveBeenCalledWith('user.created', payload);
    });
  });

  describe('connect()', () => {
    it('delegates to ClientProxy.connect()', async () => {
      await client.connect();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProxy.connect).toHaveBeenCalled();
    });
  });

  describe('close()', () => {
    it('delegates to ClientProxy.close()', () => {
      client.close();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockProxy.close).toHaveBeenCalled();
    });
  });
});
