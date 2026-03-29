import { firstValueFrom } from 'rxjs';
import { MockTypedClient } from '../mock-typed-client';
import type { Command } from '../../contracts/command';
import type { Event } from '../../contracts/event';
import type { Query } from '../../contracts/query';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'user.create': Command<'user.create', { name: string }, { id: string }>;
  'user.created': Event<'user.created', { userId: string }>;
  'user.get': Query<'user.get', { id: string }, { name: string }>;
}

describe('MockTypedClient', () => {
  let mock: MockTypedClient<TestRegistry>;

  beforeEach(() => {
    mock = new MockTypedClient<TestRegistry>();
  });

  describe('send()', () => {
    it('records sent messages', () => {
      mock.send('user.create', { name: 'Alice' });

      expect(mock.messages).toHaveLength(1);
      expect(mock.messages[0]).toEqual({
        type: 'send',
        pattern: 'user.create',
        payload: { name: 'Alice' },
      });
    });

    it('returns canned response when set', async () => {
      mock.setResponse('user.create', { id: '42' });

      const result = await firstValueFrom(mock.send('user.create', { name: 'Alice' }));

      expect(result).toEqual({ id: '42' });
    });

    it('returns undefined when no response is set', async () => {
      const result = await firstValueFrom(mock.send('user.create', { name: 'Alice' }));

      expect(result).toBeUndefined();
    });
  });

  describe('emit()', () => {
    it('records emitted messages', () => {
      mock.emit('user.created', { userId: '42' });

      expect(mock.messages).toHaveLength(1);
      expect(mock.messages[0]).toEqual({
        type: 'emit',
        pattern: 'user.created',
        payload: { userId: '42' },
      });
    });

    it('returns Observable<undefined>', async () => {
      const result = await firstValueFrom(mock.emit('user.created', { userId: '42' }));

      expect(result).toBeUndefined();
    });
  });

  describe('connect()', () => {
    it('resolves immediately', async () => {
      await expect(mock.connect()).resolves.toBeUndefined();
    });
  });

  describe('close()', () => {
    it('is a no-op', () => {
      expect(() => mock.close()).not.toThrow();
    });
  });

  describe('reset()', () => {
    it('clears recorded messages', () => {
      mock.send('user.create', { name: 'Alice' });
      mock.emit('user.created', { userId: '42' });

      mock.reset();

      expect(mock.messages).toHaveLength(0);
    });

    it('clears canned responses', async () => {
      mock.setResponse('user.create', { id: '42' });
      mock.reset();

      const result = await firstValueFrom(mock.send('user.create', { name: 'Alice' }));

      expect(result).toBeUndefined();
    });
  });
});
