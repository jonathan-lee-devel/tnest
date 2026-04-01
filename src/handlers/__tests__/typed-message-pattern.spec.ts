import 'reflect-metadata';
import { PATTERN_METADATA, PATTERN_HANDLER_METADATA } from '@nestjs/microservices/constants';
import { TypedMessagePattern } from '../typed-message-pattern.decorator';
import type { Command } from '../../contracts/command';
import type { Query } from '../../contracts/query';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'user.create': Command<'user.create', { name: string }, { id: string }>;
  'user.get': Query<'user.get', { id: string }, { name: string }>;
}

describe('TypedMessagePattern', () => {
  it('applies @MessagePattern metadata with the given pattern', () => {
    class TestHandler {
      @TypedMessagePattern<TestRegistry>('user.create')
      handle(_payload: { name: string }): { id: string } {
        return { id: '1' };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const handlerType = Reflect.getMetadata(PATTERN_HANDLER_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.create']);
    expect(handlerType).toBe(1); // RequestPattern = 1
  });

  it('works with query patterns', () => {
    class TestHandler {
      @TypedMessagePattern<TestRegistry>('user.get')
      handle(_payload: { id: string }): { name: string } {
        return { name: 'Alice' };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.get']);
  });

  it('enforces method signature when pattern type parameter is provided', () => {
    class TestHandler {
      @TypedMessagePattern<TestRegistry, 'user.create'>('user.create')
      handle(_payload: { name: string }): { id: string } {
        return { id: '1' };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.create']);
  });

  it('enforces query method signature when pattern type parameter is provided', () => {
    class TestHandler {
      @TypedMessagePattern<TestRegistry, 'user.get'>('user.get')
      handle(_payload: { id: string }): { name: string } {
        return { name: 'Alice' };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.get']);
  });

  it('enforces async method signature when pattern type parameter is provided', () => {
    class TestHandler {
      @TypedMessagePattern<TestRegistry, 'user.create'>('user.create')
      // eslint-disable-next-line @typescript-eslint/require-await
      async handle(_payload: { name: string }): Promise<{ id: string }> {
        return { id: '1' };
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.create']);
  });
});
