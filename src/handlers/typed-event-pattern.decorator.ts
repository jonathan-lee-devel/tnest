import { EventPattern } from '@nestjs/microservices';
import type { ContractRegistry, EventPatterns } from '../contracts';

export function TypedEventPattern<TRegistry extends ContractRegistry>(
  pattern: EventPatterns<TRegistry>,
): MethodDecorator {
  return EventPattern(pattern);
}
