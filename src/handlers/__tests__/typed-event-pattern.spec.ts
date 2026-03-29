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

    const metadata = Reflect.getMetadata(PATTERN_METADATA, TestHandler.prototype.handle);
    const handlerType = Reflect.getMetadata(PATTERN_HANDLER_METADATA, TestHandler.prototype.handle);

    expect(metadata).toEqual(['user.created']);
    expect(handlerType).toBe(2); // EventPattern = 2
  });
});
