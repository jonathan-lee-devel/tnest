import 'reflect-metadata';
import { PATTERN_METADATA, PATTERN_HANDLER_METADATA } from '@nestjs/microservices/constants';
import { TypedEventPattern } from '../typed-event-pattern.decorator';
import type { Event } from '../../contracts/event';
import type { ContractRegistry } from '../../contracts/utility-types';

interface TestRegistry extends ContractRegistry {
  'user.created': Event<'user.created', { userId: string }>;
}

describe('TypedEventPattern', () => {
  it('applies @EventPattern metadata with the given pattern', () => {
    class TestHandler {
      @TypedEventPattern<TestRegistry>('user.created')
      handle(_payload: { userId: string }): void {
        // no-op
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const handlerType = Reflect.getMetadata(PATTERN_HANDLER_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.created']);
    expect(handlerType).toBe(2); // EventPattern = 2
  });

  it('enforces method signature when pattern type parameter is provided', () => {
    class TestHandler {
      @TypedEventPattern<TestRegistry, 'user.created'>('user.created')
      handle(_payload: { userId: string }): void {
        // no-op
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.created']);
  });

  it('enforces async method signature when pattern type parameter is provided', () => {
    class TestHandler {
      @TypedEventPattern<TestRegistry, 'user.created'>('user.created')
      async handle(_payload: { userId: string }): Promise<void> {
        // no-op
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method
    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.created']);
  });
});
